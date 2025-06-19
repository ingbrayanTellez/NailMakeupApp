// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path'); // Necesario para Multer y rutas de archivos
const fs = require('fs');     // Necesario para crear carpetas con Multer
const multer = require('multer'); // Importa Multer

// Importa las funciones del controlador de usuarios, incluyendo las nuevas
const {
    getUsers,
    getUserById,
    updateUserProfile,
    updateUserRole,
    deleteUser,        // <-- ¡NUEVA FUNCIÓN!
    updateUserAvatar,  // <-- ¡NUEVA FUNCIÓN!
    getUserActivity
} = require('../controllers/userController');

// Importa el middleware de protección y el de autorización por roles
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// =====================================================================
// Configuración de Multer para la subida de avatares
// =====================================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Asegúrate de que esta ruta sea correcta para tu entorno.
        // Asumiendo que 'backend' está al mismo nivel que 'public'.
        const uploadPath = path.join(__dirname, '..', 'public', 'uploads');

        // Crea la carpeta si no existe (importante para evitar errores)
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Define el nombre del archivo. Usamos el ID de usuario + timestamp + extensión original.
        // Asegúrate de que `req.params.id` esté disponible (la ruta es /api/users/:id/avatar)
        const userId = req.params.id;
        const fileExtension = path.extname(file.originalname);
        const fileName = `${userId}-${Date.now()}${fileExtension}`;
        cb(null, fileName);
    }
});

// Configuración principal de Multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Límite de tamaño de archivo (ej. 2 MB)
    fileFilter: function (req, file, cb) {
        // Filtrar tipos de archivo permitidos (solo imágenes)
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true); // Aceptar el archivo
        } else {
            // Rechazar el archivo y devolver un error personalizado
            cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, GIF)!'));
        }
    }
});

// =====================================================================
// Rutas de la API de Gestión de Usuarios
// =====================================================================

// @route   GET /api/users
// @desc    Obtener todos los usuarios (solo administradores)
// @access  Private/Admin
router.get('/', protect, authorizeRoles('admin'), getUsers);

// @route   GET /api/users/:id
// @desc    Obtener un usuario por ID (admin o el propio usuario)
// @access  Private/Admin or User itself
router.get('/:id', protect, getUserById);

// @route   PUT /api/users/:id
// @desc    Actualizar perfil de usuario (admin o el propio usuario)
// @access  Private/Admin or User itself
// NOTA: Esta ruta NO maneja la subida de la imagen de perfil ni el cambio de rol/contraseña directamente.
router.put('/:id', protect, updateUserProfile);

// @route   PUT /api/users/:id/role
// @desc    Actualizar el rol de un usuario (solo administradores)
// @access  Private/Admin
router.put('/:id/role', protect, authorizeRoles('admin'), updateUserRole);

// @route   DELETE /api/users/:id
// @desc    Eliminar un usuario (solo administradores)
// @access  Private/Admin
router.delete('/:id', protect, authorizeRoles('admin'), deleteUser); // <-- ¡NUEVA RUTA!

// @route   PUT /api/users/:id/avatar
// @desc    Subir o actualizar el avatar del usuario
// @access  Private/User itself
// 'avatar' es el nombre del campo en el FormData que contiene el archivo
router.put('/:id/avatar', protect, upload.single('avatar'), updateUserAvatar); // <-- ¡NUEVA RUTA!

// @route   GET /api/users/:id/activity
// @desc    Obtener actividades de usuario (compras, carrito) (admin o el propio usuario)
// @access  Private/Admin or User itself
router.get('/:id/activity', protect, getUserActivity);

module.exports = router;