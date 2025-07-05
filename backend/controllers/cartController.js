// backend/controllers/cartController.js

const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper function to populate the cart items with product details
const populateCart = async (cart) => {
    if (!cart) return null;
    return await Cart.findById(cart._id).populate('items.productId');
};

// @desc    Obtener el carrito del usuario autenticado
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id; 
        console.log('DEBUG (CartController.getCart): Solicitud para obtener carrito de userId:', userId);

        let cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart) {
            cart = await Cart.create({ userId, items: [] });
            console.log('DEBUG (CartController.getCart): Nuevo carrito creado para el usuario:', userId);
        }

        // Filter out items where productId is null (product might have been deleted)
        const originalItemCount = cart.items.length;
        cart.items = cart.items.filter(item => item.productId !== null);
        if (cart.items.length !== originalItemCount) {
            await cart.save(); 
            console.log('DEBUG (CartController.getCart): Ítems nulos filtrados del carrito. Guardando cambios.');
        }

        // Ensure the response always sends the populated cart with the 'cart' property
        console.log('DEBUG (CartController.getCart): Carrito listo para enviar:', cart);
        res.status(200).json({ cart }); // Correct format: { cart: [...] }
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el carrito.' });
    }
};

// @desc    Añadir/Actualizar un producto en el carrito
// @route   POST /api/cart
// @access  Private
exports.addItemToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || typeof quantity === 'undefined' || quantity <= 0) {
        return res.status(400).json({ message: 'ID de producto y cantidad válidos son requeridos.' });
    }

    if (req.user.role !== 'user') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los usuarios pueden añadir productos al carrito.' });
    }

    try {
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
            console.log('DEBUG (CartController.addItemToCart): Nuevo carrito creado al añadir ítem:', userId);
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            const currentCartQuantity = cart.items[itemIndex].quantity;
            const newQuantity = currentCartQuantity + quantity;

            if (newQuantity > product.stock) {
                return res.status(400).json({ message: `Stock insuficiente para ${product.name}. Solo puedes añadir ${product.stock - currentCartQuantity} unidades más.` });
            }
            cart.items[itemIndex].quantity = newQuantity;
            console.log(`DEBUG (CartController.addItemToCart): Cantidad de ${product.name} actualizada a ${newQuantity}`);
        } else {
            if (quantity > product.stock) {
                return res.status(400).json({ message: `Stock insuficiente para ${product.name}. Solo quedan ${product.stock} unidades.` });
            }
            cart.items.push({ productId, quantity }); 
            console.log(`DEBUG (CartController.addItemToCart): ${product.name} añadido al carrito.`);
        }

        await cart.save();
        const populatedCart = await populateCart(cart); // Use helper for consistency
        res.status(200).json({ message: 'Producto añadido/actualizado en el carrito.', cart: populatedCart }); // Correct format
    } catch (error) {
        console.error('Error al añadir/actualizar producto en el carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al gestionar el carrito.', error: error.message });
    }
};

// @desc    Actualizar la cantidad de un producto en el carrito (incrementar/decrementar o establecer)
// @route   PUT /api/cart/:productId/quantity
// @access  Private
exports.updateCartItemQuantity = async (req, res) => {
    const { productId } = req.params;
    const { change } = req.body; 

    if (typeof change === 'undefined' || (change !== 1 && change !== -1)) {
        return res.status(400).json({ message: 'El valor de cambio debe ser 1 o -1.' });
    }

    if (req.user.role !== 'user') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los usuarios pueden modificar su carrito.' });
    }

    try {
        let cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado.' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Producto no encontrado en el carrito.' });
        }

        const currentQuantity = cart.items[itemIndex].quantity;
        let newQuantity = currentQuantity + change;

        if (newQuantity <= 0) {
            cart.items.splice(itemIndex, 1);
            await cart.save();
            const populatedCartAfterRemoval = await populateCart(cart); // Use helper
            return res.status(200).json({ message: 'Producto removido del carrito.', cart: populatedCartAfterRemoval }); // Correct format
        }

        if (change > 0) {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Producto referenciado en el carrito no encontrado en la base de datos.' });
            }
            if (newQuantity > product.stock) {
                return res.status(400).json({ message: `Stock insuficiente para ${product.name}. Solo quedan ${product.stock - currentQuantity} unidades más.` });
            }
        }

        cart.items[itemIndex].quantity = newQuantity;
        await cart.save();
        const populatedCart = await populateCart(cart); // Use helper
        res.status(200).json({ message: 'Cantidad del producto actualizada.', cart: populatedCart }); // Correct format

    } catch (error) {
        console.error('Error al actualizar la cantidad del carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar la cantidad del carrito.' });
    }
};


// @desc    Remover un producto del carrito
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeItemFromCart = async (req, res) => {
    const { productId } = req.params;
    const userId = req.user.id;

    if (req.user.role !== 'user') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los usuarios pueden modificar su carrito.' });
    }

    try {
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado.' });
        }

        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        if (cart.items.length === initialLength) {
            return res.status(404).json({ message: 'Producto no encontrado en el carrito para eliminar.' });
        }

        await cart.save();
        const populatedCart = await populateCart(cart); // Use helper
        res.status(200).json({ message: 'Producto eliminado del carrito.', cart: populatedCart }); // Correct format
    } catch (error) {
        console.error('Error al eliminar producto del carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// @desc    Vaciar el carrito del usuario
// @route   DELETE /api/cart/clear
// @access  Private
exports.clearCart = async (req, res) => {
    const userId = req.user.id;

    if (req.user.role !== 'user') {
        return res.status(403).json({ message: 'Acceso denegado. Solo los usuarios pueden vaciar su carrito.' });
    }

    try {
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // If cart doesn't exist, it's already "clear"
            return res.status(200).json({ message: 'El carrito ya está vacío o no existe para este usuario.', cart: { userId, items: [] } }); 
        }

        cart.items = []; // Vaciar el array de ítems
        await cart.save();

        res.status(200).json({ message: 'Carrito vaciado con éxito.', cart: { userId: cart.userId, items: [] } }); // Correct format
    } catch (error) {
        console.error('Error al vaciar el carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al vaciar el carrito.' });
    }
};


// --- Rutas de Administración de Carritos (Solo para Rol 'admin') ---

// @desc    Obtener todos los carritos (Solo para administradores)
// @route   GET /api/cart/admin-all
// @access  Private (Admin)
exports.getAllCartsForAdmin = async (req, res) => { 
    try {
        // Find non-empty carts and populate user/product details
        const carts = await Cart.find({ 'items.0': { '$exists': true } }) 
                                .populate('userId', 'username email') 
                                .populate('items.productId', 'name price imageUrl'); 
        
        // Format the response for easier frontend consumption
        const formattedCarts = carts.map(cart => ({
            userId: cart.userId ? cart.userId._id : null, // Handle case where user might be null if deleted
            username: cart.userId ? cart.userId.username : 'Usuario Desconocido',
            email: cart.userId ? cart.userId.email : 'N/A',
            cartId: cart._id,
            items: cart.items.map(item => ({
                productId: item.productId ? item.productId._id : null,
                name: item.productId ? item.productId.name : 'Producto Desconocido',
                quantity: item.quantity,
                price: item.productId ? item.productId.price : 0,
                imageUrl: item.productId ? item.productId.imageUrl : ''
            })),
            totalItems: cart.items.reduce((acc, item) => acc + item.quantity, 0),
            totalAmount: cart.items.reduce((acc, item) => acc + (item.quantity * (item.productId ? item.productId.price : 0)), 0),
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt
        }));

        res.status(200).json({ carts: formattedCarts }); // Correct format
    } catch (error) {
        console.error('Error al obtener todos los carritos (admin):', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener carritos.' });
    }
};

// @desc    Vaciar el carrito de un usuario específico (Solo para administradores)
// @route   DELETE /api/cart/admin/:userId
// @access  Private (Admin)
exports.clearUserCartAdmin = async (req, res) => { 
    try {
        const { userId } = req.params;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Carrito de usuario no encontrado.' });
        }

        cart.items = []; 
        await cart.save();

        res.status(200).json({ message: `Carrito del usuario ${userId} vaciado con éxito.`, cart: { userId: cart.userId, items: [] } }); // Correct format
    } catch (error) {
        console.error('Error al vaciar el carrito de usuario (admin):', error);
        res.status(500).json({ message: 'Error interno del servidor al vaciar el carrito.' });
    }
};
