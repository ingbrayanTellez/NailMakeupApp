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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // Importante: Debe coincidir con el 'limit' en main.js (actualmente 6)
    const skip = (page - 1) * limit; // Calcula cuántos documentos saltar

    let query = {}; // Objeto para construir la consulta de Mongoose

    // 1. Filtro por búsqueda (nombre o descripción)
    if (search) {
        // Usamos $or para buscar en nombre O descripción
        // $regex para búsqueda de subcadena, $options: 'i' para que sea insensible a mayúsculas/minúsculas
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // 2. Filtro por categoría
    // Si se proporciona una categoría y no es "All" (valor común para indicar sin filtro)
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
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit); // Calcula el número total de páginas

    // Obtener los productos aplicando filtros Y paginación
    const products = await Product.find(query)
                                .skip(skip) // Salta documentos según la página
                                .limit(limit); // Limita el número de documentos por página

    // Envía la respuesta JSON con los productos y la metadata de paginación
    res.json({
        products,        // El array de productos para la página actual
        page,            // La página actual
        totalPages,      // El total de páginas disponibles
        totalProducts    // El total de productos que coinciden con los filtros
    });
});

// @desc    Crear un nuevo producto
// @route   POST /api/products
// @access  Private (Solo administradores)
exports.createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, stock } = req.body;

    // Obtener la ruta de la imagen cargada por Multer
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    if (!name || !description || !price || !category || !stock) {
        // Si hay una imagen pero faltan otros campos, eliminarla
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
        imageUrl // Guarda la URL de la imagen
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

    // Si se sube un nuevo archivo, actualizar la ruta de la imagen
    if (req.file) {
        newImageUrl = `/uploads/${req.file.filename}`;
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
        // Si el producto no existe, y se subió una imagen, eliminarla
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(404);
        throw new Error('Producto no encontrado.');
    }

    // Si se subió una nueva imagen y ya existía una imagen anterior, eliminar la antigua
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
    product.imageUrl = newImageUrl || product.imageUrl; // Usa la nueva URL o mantiene la anterior

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

    // Eliminar la imagen asociada del sistema de archivos
    if (product.imageUrl) {
        const imagePath = path.join(__dirname, '../../public', product.imageUrl);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    await Product.deleteOne({ _id: req.params.id });

    res.json({ message: 'Producto eliminado exitosamente.' });
});