// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();

// Importa el middleware de protección
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Importa las funciones del controlador de pedidos
const {
    createOrder,      // Para POST /api/orders
    getMyOrders,      // Para GET /api/orders/myorders
    getOrderDetail,   // Para GET /api/orders/:id (para el usuario que hizo el pedido)
    getAllOrders,     // Para GET /api/admin/orders (para administradores)
    getSingleOrder,   // <--- ¡NUEVO: Para GET /api/admin/orders/:id!
    updateOrderStatus, // Para PUT /api/admin/orders/:id/status (para administradores)
    deleteOrder       // Para DELETE /api/admin/orders/:id (para administradores)
} = require('../controllers/orderController'); // Asegúrate de que esta ruta es correcta

// =====================================================================
// DEFINICIÓN DE RUTAS DE PEDIDOS PARA USUARIOS
// =====================================================================

// @route   POST /api/orders
// @desc    Crear un nuevo pedido
// @access  Private (solo usuarios autenticados)
router.post('/', protect, createOrder);

// @route   GET /api/orders/myorders
// @desc    Obtener todos los pedidos del usuario autenticado
// @access  Private
router.get('/myorders', protect, getMyOrders);

// @route   GET /api/orders/:id
// @desc    Obtener detalles de un pedido específico (accesible por el usuario que lo hizo o por un admin)
// @access  Private
router.get('/:id', protect, getOrderDetail);

// =====================================================================
// RUTAS DE ADMINISTRACIÓN DE PEDIDOS (solo accesibles por administradores)
// =====================================================================

// @route   GET /api/admin/orders
// @desc    Obtener todos los pedidos (solo administradores)
// @access  Private/Admin
router.get('/admin/orders', protect, authorizeRoles('admin'), getAllOrders);

// @route   GET /api/admin/orders/:id
// @desc    Obtener un solo pedido por ID (solo administradores)
// @access  Private/Admin
router.get('/admin/orders/:id', protect, authorizeRoles('admin'), getSingleOrder); // <--- ¡LA RUTA QUE FALTABA!

// @route   PUT /api/admin/orders/:id/status
// @desc    Actualizar el estado de un pedido (solo administradores)
// @access  Private/Admin
router.put('/admin/orders/:id/status', protect, authorizeRoles('admin'), updateOrderStatus);

// @route   DELETE /api/admin/orders/:id
// @desc    Eliminar un pedido (solo administradores)
// @access  Private/Admin
router.delete('/admin/orders/:id', protect, authorizeRoles('admin'), deleteOrder);


module.exports = router;
