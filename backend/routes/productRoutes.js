const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // Asegúrate que este modelo exista y esté correctamente definido
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Importa el controlador de productos
const productController = require('../controllers/productController');

// Importa el middleware de autenticación y autorización
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// =====================================================================
// Configuración de Multer para la subida de imágenes
// =====================================================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // La ruta de destino debe ser relativa al directorio raíz del servidor que sirve archivos estáticos.
        // Desde 'backend/routes' (__dirname), necesitamos subir dos niveles ('../../')
        // para llegar a la raíz del proyecto y luego entrar en 'public/uploads'.
        const uploadPath = path.join(__dirname, '../../public/uploads');

        // Asegúrate de que el directorio de uploads exista.
        // Si no existe, lo crea de forma recursiva.
        try {
            fs.mkdirSync(uploadPath, { recursive: true });
        } catch (err) {
            console.error('Error al crear el directorio de subidas:', err);
            // Pasa el error al callback de Multer para que el proceso de subida falle
            return cb(err);
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // *** ¡¡¡ESTA ES LA LÍNEA CRÍTICA CORREGIDA!!! ***
        // Asegúrate de que no haya ninguna etiqueta HTML (como <span>) o caracteres inválidos aquí.
        // Genera un nombre de archivo único utilizando la marca de tiempo actual y el nombre original del archivo.
        // Esto previene colisiones y mantiene la extensión original.
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB por archivo
    fileFilter: (req, file, cb) => {
        // Verifica el tipo de archivo (solo imágenes)
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)!'));
    }
});

// =====================================================================
// Rutas de la API de Productos
// =====================================================================

// @route   GET /api/products
// @desc    Obtener todos los productos
// @access  Public
router.get('/', productController.getAllProducts);

// @route   GET /api/products/:id
// @desc    Obtener un producto por ID
// @access  Public
router.get('/:id', productController.getProductById);

// @route   POST /api/products
// @desc    Crear un nuevo producto
// @access  Private (Solo administradores)
// Aplica el middleware 'protect' para verificar el token JWT.
// Aplica el middleware 'authorizeRoles('admin')' para restringir solo a administradores.
// Aplica 'upload.single('imageUrl')' para manejar la subida de la imagen antes de que el controlador la procese.
router.post('/', protect, authorizeRoles('admin'), upload.single('imageUrl'), productController.createProduct);

// @route   PUT /api/products/:id
// @desc    Actualizar un producto
// @access  Private (Solo administradores)
// Aplica los mismos middlewares de protección y autorización, y manejo de subida de imagen.
router.put('/:id', protect, authorizeRoles('admin'), upload.single('imageUrl'), productController.updateProduct);

// @route   DELETE /api/products/:id
// @desc    Eliminar un producto
// @access  Private (Solo administradores)
// Aplica los middlewares de protección y autorización.
router.delete('/:id', protect, authorizeRoles('admin'), productController.deleteProduct);


module.exports = router;