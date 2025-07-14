// backend/controllers/orderController.js
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order'); // Asegúrate de que la ruta a tu modelo Order sea correcta
const User = require('../models/User'); // Para poblar información del usuario si es necesario
const Product = require('../models/Product'); // Para verificar stock al crear un pedido

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (users can create their own orders)
exports.createOrder = asyncHandler(async (req, res) => {
    const { items, shippingInfo, paymentMethod, paymentDetails } = req.body;

    if (!items || items.length === 0) {
        res.status(400);
        throw new Error('No hay ítems en el pedido.');
    }
    if (!shippingInfo) {
        res.status(400);
        throw new Error('La información de envío es requerida.');
    }
    if (!paymentMethod) {
        res.status(400);
        throw new Error('El método de pago es requerido.');
    }

    let totalAmount = 0;
    const orderItems = [];

    // Verificar stock y calcular el total
    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
            res.status(404);
            throw new Error(`Producto no encontrado: ${item.name || item.productId}`);
        }
        if (product.stock < item.quantity) {
            res.status(400);
            throw new Error(`Stock insuficiente para el producto: ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`);
        }

        // Reducir stock
        product.stock -= item.quantity;
        await product.save();

        totalAmount += product.price * item.quantity;

        orderItems.push({
            productId: product._id,
            name: product.name,
            quantity: item.quantity,
            price: product.price,
            imageUrl: product.imageUrl // Guarda la URL de la imagen del producto
        });
    }

    const order = await Order.create({
        user: req.user._id, // El ID del usuario autenticado
        items: orderItems,
        total: totalAmount,
        shippingInfo,
        paymentMethod,
        paymentDetails,
        status: 'pending', // Estado inicial del pedido
        paymentStatus: 'paid' // Asumiendo que el pago se realiza al crear el pedido
    });

    res.status(201).json({ message: 'Pedido creado exitosamente.', order });
});


// @desc    Get all orders for the logged in user
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).populate('user', 'username email');
    res.status(200).json(orders);
});


// @desc    Get all orders (for admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
    const pageSize = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const searchTerm = req.query.search ? req.query.search.toLowerCase() : '';
    const statusFilter = req.query.status || '';

    let query = {};

    if (statusFilter) {
        query.status = statusFilter;
    }

    if (searchTerm) {
        // Buscar por ID de pedido o por nombre de usuario del pedido
        const userIds = await User.find({ username: { $regex: searchTerm, $options: 'i' } }).select('_id');
        query.$or = [
            { _id: searchTerm }, // Buscar por ID de pedido
            { 'user': { $in: userIds.map(user => user._id) } } // Buscar por usuario
        ];
    }

    const count = await Order.countDocuments(query);
    const orders = await Order.find(query)
        .populate('user', 'username email') // Popula el usuario que hizo el pedido
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.status(200).json({
        orders,
        page,
        pages: Math.ceil(count / pageSize),
        totalOrders: count
    });
});

// @desc    Get single order details (for user itself or admin via /api/orders/:id)
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderDetail = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'username email');

    if (!order) {
        res.status(404);
        throw new Error('Pedido no encontrado.');
    }

    // Permitir acceso si es el propio usuario o un administrador
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('No autorizado para ver este pedido.');
    }

    res.status(200).json(order);
});

// @desc    Get single order by ID (for admin only, specifically for /api/admin/orders/:id)
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
exports.getSingleOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'username email') // Popula la información del usuario
        .populate({
            path: 'items.productId', // Si tus items tienen un productId que referencia a Product
            select: 'name imageUrl price' // Selecciona los campos que quieres mostrar del producto
        });

    if (!order) {
        res.status(404);
        throw new Error('Pedido no encontrado.');
    }

    // No se necesita validación de rol aquí, ya que el middleware authorizeRoles('admin')
    // en la ruta ya asegura que solo los administradores accedan a esta función.
    res.status(200).json(order);
});


// @desc    Update order status (for admin)
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        res.status(400);
        throw new Error('El estado del pedido es requerido.');
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        res.status(400);
        throw new Error(`Estado de pedido inválido. Los estados válidos son: ${validStatuses.join(', ')}`);
    }

    const order = await Order.findById(id);

    if (!order) {
        res.status(404);
        throw new Error('Pedido no encontrado.');
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.status(200).json({ message: 'Estado del pedido actualizado exitosamente.', order: updatedOrder });
});

// @desc    Delete an order (for admin - use with caution)
// @route   DELETE /api/admin/orders/:id
// @access  Private/Admin
exports.deleteOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
        res.status(404);
        throw new Error('Pedido no encontrado.');
    }

    await order.deleteOne();

    res.status(200).json({ message: 'Pedido eliminado exitosamente.' });
});
