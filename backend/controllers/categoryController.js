// backend/controllers/categoryController.js
const asyncHandler = require('express-async-handler');
const Category = require('../models/Category'); // Asegúrate de que la ruta a tu modelo Category sea correcta

// @desc    Get all categories
// @route   GET /api/categories (o /api/admin/categories si es solo para admin)
// @access  Public o Private/Admin
exports.getAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({});
    res.status(200).json(categories);
});

// @desc    Create a new category
// @route   POST /api/admin/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name) {
        res.status(400);
        throw new Error('El nombre de la categoría es requerido.');
    }

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
        res.status(400);
        throw new Error('Ya existe una categoría con este nombre.');
    }

    const category = await Category.create({ name });
    res.status(201).json({ message: 'Categoría creada exitosamente.', category });
});

// @desc    Update a category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        res.status(400);
        throw new Error('El nombre de la categoría es requerido.');
    }

    const category = await Category.findById(id);

    if (!category) {
        res.status(404);
        throw new Error('Categoría no encontrada.');
    }

    // Opcional: Verificar si el nuevo nombre ya existe en otra categoría
    const existingCategory = await Category.findOne({ name, _id: { $ne: id } });
    if (existingCategory) {
        res.status(400);
        throw new Error('Ya existe otra categoría con este nombre.');
    }

    category.name = name;
    const updatedCategory = await category.save();

    res.status(200).json({ message: 'Categoría actualizada exitosamente.', category: updatedCategory });
});

// @desc    Delete a category
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
        res.status(404);
        throw new Error('Categoría no encontrada.');
    }

    // Opcional: Verificar si hay productos asociados a esta categoría antes de eliminarla
    // const productsWithCategory = await Product.countDocuments({ category: category.name });
    // if (productsWithCategory > 0) {
    //     res.status(400);
    //     throw new Error('No se puede eliminar la categoría porque tiene productos asociados.');
    // }

    await category.deleteOne(); // Usar deleteOne() para eliminar el documento

    res.status(200).json({ message: 'Categoría eliminada exitosamente.' });
});
