// backend/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware'); 
const { 
    createOrder, 
    getMyOrders, 
    getAllOrders, 
    updateOrderStatus, 
    deleteOrder,
    getOrderById // Asegúrate de importar todas las funciones que uses
} = require('../controllers/orderController');

// Rutas de usuario
router.route('/')
    .post(protect, createOrder); // Crear una nueva orden (solo usuarios autenticados)

router.route('/me')
    .get(protect, getMyOrders); // Obtener órdenes del usuario autenticado

// Rutas de administración (requieren rol 'admin')
router.route('/admin')
    .get(protect, authorizeRoles('admin'), getAllOrders); // Obtener todas las órdenes

router.route('/:orderId/status')
    .put(protect, authorizeRoles('admin'), updateOrderStatus); // Actualizar estado de una orden

router.route('/:id')
    .get(protect, getOrderById) // Obtener una orden por ID (propietario o admin)
    .delete(protect, authorizeRoles('admin'), deleteOrder); // Eliminar una orden

module.exports = router;