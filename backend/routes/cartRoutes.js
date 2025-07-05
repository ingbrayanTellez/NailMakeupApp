// backend/routes/cartRoutes.js

console.log('Cargando backend/routes/cartRoutes.js - Versión actualizada (Admin con carrito habilitado)'); // <-- Mensaje de verificación actualizado

const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware'); 
const Cart = require('../models/Cart'); 
const Product = require('../models/Product'); 

// === Middleware userOnly ELIMINADO de las rutas del carrito ===
// Si deseas que solo los usuarios normales tengan carrito, deberías volver a añadirlo.
// Si lo eliminas, tanto 'user' como 'admin' podrán usar el carrito.

// @route   GET /api/cart
// @desc    Obtener el carrito del usuario autenticado
// @access  Private (User/Admin)
router.get('/', protect, async (req, res) => { // userOnly eliminado
    try {
        const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
        if (!cart) {
            // Si no hay carrito, devolver uno vacío
            return res.status(200).json({ items: [], totalAmount: 0 });
        }
        // Calcular el totalAmount aquí en el backend para mayor seguridad
        const totalAmount = cart.items.reduce((acc, item) => acc + (item.productId.price * item.quantity), 0);
        res.status(200).json({ items: cart.items, totalAmount: totalAmount });
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el carrito.' });
    }
});

// @route   POST /api/cart
// @desc    Añadir un producto al carrito o incrementar su cantidad
// @access  Private (User/Admin)
router.post('/', protect, async (req, res) => { // userOnly eliminado
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'ID de producto y cantidad válidos son requeridos.' });
    }

    try {
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // Crear un nuevo carrito si no existe
            cart = new Cart({ userId, items: [] });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        // Verificar stock disponible
        if (product.stock < quantity) {
            return res.status(400).json({ message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            // El producto ya está en el carrito, actualizar cantidad
            const currentItem = cart.items[itemIndex];
            if (product.stock < (currentItem.quantity + quantity)) {
                return res.status(400).json({ message: `No hay suficiente stock para añadir más de ${product.name}. Disponible: ${product.stock - currentItem.quantity}` });
            }
            currentItem.quantity += quantity;
        } else {
            // Añadir nuevo producto al carrito
            cart.items.push({ productId, quantity });
        }

        await cart.save();
        res.status(200).json({ message: 'Producto añadido al carrito.', cart });
    } catch (error) {
        console.error('Error al añadir producto al carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al añadir producto al carrito.' });
    }
});

// @route   PUT /api/cart/:productId/quantity
// @desc    Actualizar la cantidad de un producto en el carrito (incrementar/decrementar)
// @access  Private (User/Admin)
router.put('/:productId/quantity', protect, async (req, res) => { // userOnly eliminado
    const { productId } = req.params;
    const { change } = req.body; // 'change' será 1 o -1
    const userId = req.user.id;

    if (change !== 1 && change !== -1) {
        return res.status(400).json({ message: 'El cambio de cantidad debe ser 1 o -1.' });
    }

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado.' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Producto no encontrado en el carrito.' });
        }

        const currentItem = cart.items[itemIndex];
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado en la base de datos.' });
        }

        if (change === 1) { // Incrementar
            if (currentItem.quantity >= product.stock) {
                return res.status(400).json({ message: `No hay más stock disponible para ${product.name}.` });
            }
            currentItem.quantity += 1;
        } else { // Decrementar
            if (currentItem.quantity <= 1) {
                return res.status(400).json({ message: 'La cantidad no puede ser menor a 1.' });
            }
            currentItem.quantity -= 1;
        }

        await cart.save();
        res.status(200).json({ message: 'Cantidad del producto actualizada.', cart });
    } catch (error) {
        console.error('Error al actualizar la cantidad del carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar la cantidad del carrito.' });
    }
});

// @route   DELETE /api/cart/:productId
// @desc    Remover un producto del carrito
// @access  Private (User/Admin)
router.delete('/:productId', protect, async (req, res) => { // userOnly eliminado
    const { productId } = req.params;
    const userId = req.user.id;

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado.' });
        }

        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        if (cart.items.length === initialLength) {
            return res.status(404).json({ message: 'Producto no encontrado en el carrito para remover.' });
        }

        await cart.save();
        res.status(200).json({ message: 'Producto removido del carrito.', cart });
    } catch (error) {
        console.error('Error al remover producto del carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al remover producto del carrito.' });
    }
});

// @route   DELETE /api/cart/clear
// @desc    Vaciar todo el carrito del usuario
// @access  Private (User/Admin)
router.delete('/clear', protect, async (req, res) => { // userOnly eliminado
    const userId = req.user.id;
    try {
        const cart = await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: [] } },
            { new: true }
        );
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado para vaciar.' });
        }
        res.status(200).json({ message: 'Carrito vaciado exitosamente.', cart });
    } catch (error) {
        console.error('Error al vaciar el carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al vaciar el carrito.' });
    }
});

module.exports = router;