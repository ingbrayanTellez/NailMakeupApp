// backend/controllers/productController.js
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product'); // Asegúrate de que la ruta a tu modelo Product sea correcta
const path = require('path');
const fs = require('fs');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = asyncHandler(async (req, res) => {
    const pageSize = parseInt(req.query.limit) || 6; // Por defecto 6 productos por página
    const page = parseInt(req.query.page) || 1;
    const searchTerm = req.query.search ? req.query.search.toLowerCase() : '';
    const categoryFilter = req.query.category || 'All';
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Infinity;

    let query = {};

    // Filtro por término de búsqueda (nombre o descripción)
    if (searchTerm) {
        query.$or = [
            { name: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } }
        ];
    }

    // Filtro por categoría
    if (categoryFilter !== 'All') {
        query.category = categoryFilter;
    }

    // Filtro por rango de precio
    query.price = { $gte: minPrice, $lte: maxPrice };

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 }); // Ordenar por los más nuevos primero

    res.status(200).json({
        products,
        page,
        pages: Math.ceil(count / pageSize),
        totalProducts: count
    });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Producto no encontrado.');
    }

    res.status(200).json(product);
});

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, stock } = req.body;

    if (!name || !description || !price || !category || stock === undefined) {
        res.status(400);
        throw new Error('Por favor, completa todos los campos requeridos para el producto.');
    }

    // Si se subió una imagen, req.file contendrá la información del archivo
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '/img/placeholder.png'; // Ruta relativa

    const product = await Product.create({
        name,
        description,
        price,
        category,
        stock,
        imageUrl,
        user: req.user._id // Asocia el producto al ID del usuario (admin) que lo creó
    });

    res.status(201).json({ message: 'Producto creado exitosamente.', product });
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, stock } = req.body;
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
        res.status(404);
        throw new Error('Producto no encontrado.');
    }

    // Si hay un nuevo archivo de imagen, eliminar el antiguo si no es el placeholder
    if (req.file) {
        if (product.imageUrl && product.imageUrl !== '/img/placeholder.png') {
            const oldImagePath = path.join(__dirname, '..', '..', 'public', product.imageUrl);
            fs.unlink(oldImagePath, (err) => {
                if (err) console.error('Error al eliminar imagen antigua:', err);
            });
        }
        product.imageUrl = `/uploads/${req.file.filename}`;
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price !== undefined ? price : product.price;
    product.category = category || product.category;
    product.stock = stock !== undefined ? stock : product.stock;

    const updatedProduct = await product.save();

    res.status(200).json({ message: 'Producto actualizado exitosamente.', product: updatedProduct });
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
        res.status(404);
        throw new Error('Producto no encontrado.');
    }

    // Eliminar la imagen del producto si no es el placeholder
    if (product.imageUrl && product.imageUrl !== '/img/placeholder.png') {
        const imagePath = path.join(__dirname, '..', '..', 'public', product.imageUrl);
        fs.unlink(imagePath, (err) => {
            if (err) console.error('Error al eliminar imagen del producto:', err);
        });
    }

    await product.deleteOne();

    res.status(200).json({ message: 'Producto eliminado exitosamente.' });
});
