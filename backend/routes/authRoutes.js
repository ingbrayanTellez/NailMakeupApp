// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
// Asegúrate de importar 'changePassword' junto con las otras funciones
const { registerUser, loginUser, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Importa el middleware de protección

// =====================================================================
// Rutas de la API de Autenticación
// =====================================================================

// @route   POST /api/auth/register
// @desc    Registrar un nuevo usuario
// @access  Public
router.post('/register', registerUser); // Usamos registerUser directamente

// @route   POST /api/auth/login
// @desc    Autenticar usuario y obtener token
// @access  Public
router.post('/login', loginUser); // Usamos loginUser directamente

// @route   GET /api/auth/me
// @desc    Obtener información del usuario autenticado
// @access  Private (requiere token)
router.get('/me', protect, getMe); // Usamos getMe directamente

// @route   PUT /api/auth/change-password
// @desc    Permite a un usuario autenticado cambiar su contraseña
// @access  Private (requiere token)
router.put('/change-password', protect, changePassword); // ¡NUEVA RUTA!

module.exports = router;