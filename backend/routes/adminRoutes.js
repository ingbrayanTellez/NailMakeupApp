const express = require('express');
const router = express.Router();

// Importa los middlewares de autenticacion y autorizacion
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// =====================================================================
// Importa las funciones de los controladores para cada funcionalidad admin
// =====================================================================

// Controladores de Usuario
const {
    getUsers,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    getUserActivity
} = require('../controllers/userController');

// Controladores de Pedidos
const {
    getAllOrders,
    updateOrderStatus,
    getOrderDetail,
    getSingleOrder,
    deleteOrder
} = require('../controllers/orderController');

// Controladores de Categorias
const {
    createCategory,
    updateCategory,
    deleteCategory,
    getAllCategories
} = require('../controllers/categoryController');

// Controladores de Descuentos
const {
    getAllDiscounts,
    getDiscountById,
    createDiscount,
    updateDiscount,
    deleteDiscount
} = require('../controllers/discountController');

// Controladores de Estadisticas
const {
    getTotalSales,
    getTopProducts,
    getActiveUsersCount
} = require('../controllers/statsController');


// =====================================================================
// DEFINICION DE RUTAS DE ADMINISTRACION
// Todas estas rutas requieren autenticacion (protect) y rol de admin (authorizeRoles('admin'))
// =====================================================================

// Rutas de Gestion de Usuarios (Admin)
router.get('/users', protect, authorizeRoles('admin'), getUsers);
router.put('/users/:id/role', protect, authorizeRoles('admin'), updateUserRole);
router.put('/users/:id/status', protect, authorizeRoles('admin'), toggleUserStatus);
router.delete('/users/:id', protect, authorizeRoles('admin'), deleteUser);
router.get('/users/:id/activity', protect, authorizeRoles('admin'), getUserActivity);

// Rutas de Gestion de Pedidos (Admin)
router.get('/orders', protect, authorizeRoles('admin'), getAllOrders);
router.get('/orders/:id', protect, authorizeRoles('admin'), getSingleOrder || getOrderDetail);
router.put('/orders/:id/status', protect, authorizeRoles('admin'), updateOrderStatus);
router.delete('/orders/:id', protect, authorizeRoles('admin'), deleteOrder);

// Rutas de Gestion de Categorias (Admin)
router.post('/categories', protect, authorizeRoles('admin'), createCategory);
router.put('/categories/:id', protect, authorizeRoles('admin'), updateCategory);
router.delete('/categories/:id', protect, authorizeRoles('admin'), deleteCategory);

// Rutas de Gestion de Descuentos (Admin)
router.get('/discounts', protect, authorizeRoles('admin'), getAllDiscounts);
router.get('/discounts/:id', protect, authorizeRoles('admin'), getDiscountById);
router.post('/discounts', protect, authorizeRoles('admin'), createDiscount);
router.put('/discounts/:id', protect, authorizeRoles('admin'), updateDiscount);
router.delete('/discounts/:id', protect, authorizeRoles('admin'), deleteDiscount);

// Rutas de Estadisticas y Reportes (Admin)
console.log('DEBUG: Valor de getActiveUsersCount antes de la ruta:', typeof getActiveUsersCount, getActiveUsersCount); // <--- LINEA DE DEBUG!
router.get('/stats/sales', protect, authorizeRoles('admin'), getTotalSales);
router.get('/stats/top-products', protect, authorizeRoles('admin'), getTopProducts);
router.get('/stats/active-users', protect, authorizeRoles('admin'), getActiveUsersCount); // <--- ESTA ES LA LINEA 79

module.exports = router;
