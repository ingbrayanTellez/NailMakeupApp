// backend/controllers/productController.js

const Product = require('../models/Product'); // Asegúrate de que el modelo Product esté correctamente definido
const asyncHandler = require('express-async-handler'); // Utilidad para manejar excepciones en funciones asíncronas
const path = require('path');
const fs = require('fs');

// @desc    Obtener todos los productos con filtros y paginación
// @route   GET /api/products
// @access  Public
exports.getAllProducts = asyncHandler(async (req, res) => {
    const { search, category, minPrice, maxPrice } = req.query;
    // Aseguramos que page y limit sean números, con valores por defecto si no se proporcionan o son inválidos
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // Importante: Debe coincidir con el 'limit' en main.js (actualmente 6)
    const skip = (page - 1) * limit; // Calcula cuántos documentos saltar

    let query = {}; // Objeto para construir la consulta de Mongoose

    // 1. Filtro por búsqueda (nombre o descripción)
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // 2. Filtro por categoría
    if (category && category !== 'All') {
        query.category = category; // Busca productos con la categoría exacta
    }

    // 3. Filtro por rango de precios
    if (minPrice || maxPrice) {
        query.price = {}; // Inicializa el objeto para el rango de precios
        if (minPrice) {
            query.price.$gte = parseFloat(minPrice); // Precio mayor o igual que minPrice
        }
        if (maxPrice) {
            query.price.$lte = parseFloat(maxPrice); // Precio menor o igual que maxPrice
        }
    }

    // Obtener el total de productos que coinciden con los filtros (sin aplicar paginación aún)
    let totalProducts = await Product.countDocuments(query);
    // === PEQUEÑA ADICIÓN AQUÍ PARA ASEGURAR TIPO NUMÉRICO ===
    if (typeof totalProducts !== 'number') {
        console.warn('productController: totalProducts no es un número. Convirtiendo a 0.');
        totalProducts = 0; // Asegura que sea un número, incluso si es 0
    }
    // =======================================================
    
    // Calcula el número total de páginas. Aseguramos que limit sea al menos 1 para evitar división por cero.
    const totalPages = Math.ceil(totalProducts / (limit > 0 ? limit : 1)); 

    // Obtener los productos aplicando filtros Y paginación
    const products = await Product.find(query)
                                  .skip(skip) // Salta documentos según la página
                                  .limit(limit); // Limita el número de documentos por página

    // Envía la respuesta JSON con los productos y la metadata de paginación
    res.json({
        products,          // El array de productos para la página actual
        page,              // La página actual (ya es un número)
        totalPages,        // El total de páginas disponibles (ya es un número)
        totalProducts      // El total de productos que coinciden con los filtros (ya es un número)
    });
});

// @desc    Crear un nuevo producto
// @route   POST /api/products
// @access  Private (Solo administradores)
exports.createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, stock } = req.body;

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    if (!name || !description || !price || !category || !stock) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(400);
        throw new Error('Por favor, ingresa todos los campos requeridos: nombre, descripción, precio, categoría y stock.');
    }

    const product = await Product.create({
        name,
        description,
        price,
        category,
        stock,
        imageUrl
    });

    res.status(201).json({ message: 'Producto creado exitosamente', product });
});

// @desc    Obtener un producto por ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Producto no encontrado.');
    }

    res.json(product);
});

// @desc    Actualizar un producto
// @route   PUT /api/products/:id
// @access  Private (Solo administradores)
exports.updateProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, stock } = req.body;
    let newImageUrl = '';

    if (req.file) {
        newImageUrl = `/uploads/${req.file.filename}`;
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(404);
        throw new Error('Producto no encontrado.');
    }

    if (newImageUrl && product.imageUrl) {
        const oldImagePath = path.join(__dirname, '../../public', product.imageUrl);
        if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
        }
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.stock = stock || product.stock;
    product.imageUrl = newImageUrl || product.imageUrl;

    const updatedProduct = await product.save();

    res.json({ message: 'Producto actualizado exitosamente', product: updatedProduct });
});

// @desc    Eliminar un producto
// @route   DELETE /api/products/:id
// @access  Private (Solo administradores)
exports.deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Producto no encontrado.');
    }

    if (product.imageUrl) {
        const imagePath = path.join(__dirname, '../../public', product.imageUrl);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    await Product.deleteOne({ _id: req.params.id });

    res.json({ message: 'Producto eliminado exitosamente.' });
});