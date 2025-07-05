// backend/controllers/orderController.js

const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User'); // Asegurarse de importar el modelo User si se usa

// @desc    Crear una nueva orden a partir del carrito del usuario autenticado.
// @route   POST /api/orders
// @access  Private (rol 'user')
exports.createOrder = asyncHandler(async (req, res) => {
    // req.user.id viene del middleware 'protect'
    console.log('DEBUG: createOrder - req.user:', req.user);

    if (req.user.role !== 'user') {
        res.status(403);
        throw new Error('Acceso denegado. Solo los usuarios pueden realizar pedidos.');
    }

    const userId = req.user.id;
    // La información de envío y método de pago viene del frontend (checkout.js)
    const { shippingInfo, paymentMethod } = req.body; 

    console.log('DEBUG: createOrder - Buscando carrito para userId:', userId);

    // Obtener el carrito del usuario y poblar los detalles del producto
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    console.log('DEBUG: createOrder - Carrito encontrado:', cart);
    if (cart) {
        console.log('DEBUG: createOrder - Ítems en el carrito:', cart.items.length);
    }

    if (!cart || cart.items.length === 0) {
        res.status(400);
        throw new Error('El carrito está vacío. Por favor, añade productos antes de finalizar el pedido.');
    }

    let totalAmount = 0;
    const orderItems = [];
    const bulkOperations = []; // Para actualizar el stock de productos de manera eficiente

    for (const item of cart.items) {
        const product = await Product.findById(item.productId._id);

        if (!product) {
            res.status(404);
            throw new Error(`Producto no encontrado en la base de datos: ${item.productId.name}.`);
        }
        if (product.stock < item.quantity) {
            res.status(400);
            throw new Error(`Stock insuficiente para ${product.name}. Solo quedan ${product.stock} unidades.`);
        }

        // Preparar los ítems para la orden
        orderItems.push({
            productId: product._id,
            name: product.name,
            quantity: item.quantity,
            price: product.price,
            imageUrl: product.imageUrl
        });
        totalAmount += item.quantity * product.price;

        // Preparar la operación para decrementar el stock
        bulkOperations.push({
            updateOne: {
                filter: { _id: product._id },
                update: { $inc: { stock: -item.quantity } }
            }
        });
    }

    // Ejecutar todas las actualizaciones de stock de una vez
    if (bulkOperations.length > 0) {
        await Product.bulkWrite(bulkOperations);
    }

    // Crear la nueva orden
    const order = new Order({
        userId: userId,
        items: orderItems,
        total: totalAmount, // Usar 'total' en lugar de 'totalAmount' si tu modelo Order usa 'total'
        shippingInfo: shippingInfo,
        status: 'pending', // Estado inicial
        paymentMethod: paymentMethod || 'credit-card', // Método de pago por defecto
        paymentStatus: 'paid' // Asumimos que el pago fue exitoso por la simulación del frontend
    });

    await order.save(); // Guardar la orden en la base de datos

    // Vaciar el carrito del usuario después de crear el pedido
    cart.items = [];
    await cart.save();

    res.status(201).json({ message: 'Pedido realizado con éxito y carrito vaciado.', orderId: order._id, order });
});

// @desc    Obtener todas las órdenes del usuario autenticado.
// @route   GET /api/orders/me
// @access  Private (rol 'user')
exports.getMyOrders = asyncHandler(async (req, res) => {
    // req.user.id viene del middleware 'protect'
    console.log('DEBUG: getMyOrders - req.user:', req.user);

    // No es necesario verificar el rol aquí si la ruta solo es para usuarios.
    // El middleware 'protect' ya asegura que hay un usuario autenticado.
    // Si quisieras restringir solo a rol 'user', podrías hacer:
    // if (req.user.role !== 'user') {
    //     res.status(403);
    //     throw new Error('Acceso denegado. Solo los usuarios pueden ver sus propios pedidos.');
    // }

    const userId = req.user.id;
    // Buscar órdenes por el userId y poblar los detalles de los productos
    const orders = await Order.find({ userId })
                              .populate('items.productId', 'name price imageUrl') // Popula los detalles del producto
                              .sort({ createdAt: -1 }); // Ordena por fecha de creación descendente

    // El frontend espera un array directamente, no un objeto { orders: [...] }
    res.status(200).json(orders);
});

// @desc    Obtener todas las órdenes (Solo para administradores)
// @route   GET /api/orders/admin
// @access  Private (Admin)
exports.getAllOrders = asyncHandler(async (req, res) => {
    // authorizeRoles('admin') ya maneja la verificación de rol
    try {
        const orders = await Order.find({})
                                  .populate('userId', 'username email') 
                                  .sort({ createdAt: -1 });
        res.status(200).json(orders); // Devolver array directamente
    } catch (error) {
        console.error('Error al obtener todas las órdenes (admin):', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener todas las órdenes.' });
    }
});

// @desc    Actualizar el estado de una orden (Solo para administradores)
// @route   PUT /api/orders/:orderId/status
// @access  Private (Admin)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        res.status(400);
        throw new Error('Estado de orden inválido.');
    }

    const order = await Order.findByIdAndUpdate(orderId, { status, updatedAt: Date.now() }, { new: true });

    if (!order) {
        res.status(404);
        throw new Error('Orden no encontrada.');
    }

    res.status(200).json({ message: `Estado de la orden ${orderId} actualizado a ${status}.`, order });
});

// @desc    Eliminar una orden (Solo para administradores)
// @route   DELETE /api/orders/:id
// @access  Private (Admin)
exports.deleteOrder = asyncHandler(async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            res.status(404);
            throw new Error('Orden no encontrada.');
        }

        // Opcional: Revertir el stock si la orden se cancela o elimina
        // for (let orderItem of order.items) {
        //     await Product.findByIdAndUpdate(orderItem.productId, { $inc: { stock: orderItem.quantity } });
        // }

        await Order.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Orden eliminada exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar la orden:', error);
        if (error.kind === 'ObjectId') {
            res.status(400);
            throw new Error('ID de orden inválido.');
        }
        res.status(500);
        throw new Error('Error interno del servidor al eliminar la orden.');
    }
});

// @desc    Obtener una orden por ID
// @route   GET /api/orders/:id
// @access  Private (Admin o propietario de la orden)
exports.getOrderById = asyncHandler(async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'username email').populate('items.productId', 'name price imageUrl');

        if (!order) {
            res.status(404);
            throw new Error('Orden no encontrada.');
        }

        // Permitir acceso solo si es admin o el usuario propietario de la orden
        if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('No autorizado para acceder a esta orden.');
        }

        res.status(200).json(order);
    } catch (error) {
        console.error('Error al obtener la orden por ID:', error);
        if (error.kind === 'ObjectId') {
            res.status(400);
            throw new new Error('ID de orden inválido.');
        }
        res.status(500);
        throw new Error('Error interno del servidor al obtener la orden.');
    }
});