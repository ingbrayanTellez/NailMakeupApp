// backend/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();

// Importa la función del controlador de categorías
const { getAllCategories } = require('../controllers/categoryController'); // Asegúrate de que la ruta sea correcta

// =====================================================================
// DEFINICIÓN DE RUTAS PÚBLICAS DE CATEGORÍAS
// =====================================================================

// @route   GET /api/categories
// @desc    Obtener todas las categorías
// @access  Public
router.get('/', getAllCategories);

module.exports = router;
