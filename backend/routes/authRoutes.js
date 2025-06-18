// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Importa el middleware de protección

// =====================================================================
// Rutas de la API de Autenticación
// =====================================================================

// @route   POST /api/auth/register
// @desc    Registrar un nuevo usuario
// @access  Public
router.post('/register', authController.registerUser);

// @route   POST /api/auth/login
// @desc    Autenticar usuario y obtener token
// @access  Public
router.post('/login', authController.loginUser);

// @route   GET /api/auth/me
// @desc    Obtener información del usuario autenticado
// @access  Private (requiere token)
router.get('/me', protect, authController.getMe); // <-- ESTA ES LA NUEVA RUTA

module.exports = router;