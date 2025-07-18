// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path'); // Necesario para Multer y rutas de archivos
const fs = require('fs');     // Necesario para crear carpetas con Multer
const multer = require('multer'); // Importa Multer

// Importa las funciones del controlador de usuarios
const {
    getUsers,
    getUserById,
    updateUserProfile,
    updateUserRole,
    deleteUser,
    updateUserAvatar, // Función de avatar
    getUserActivity
} = require('../controllers/userController');

// Importa el middleware de protección y el de autorización por roles
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// =====================================================================
// Configuración de Multer para la subida de avatares
// =====================================================================

// Define la ruta absoluta al directorio donde se guardarán los avatares.
// __dirname aquí es 'backend/routes'.
// '..' (sube a 'backend')
// '..' (sube a la raíz del proyecto 'tu_tienda_nail_art')
// 'public' (entra a 'tu_tienda_nail_art/public')
// 'img' (entra a 'tu_tienda_nail_art/public/img')
// 'avatars' (entra a 'tu_tienda_nail_art/public/img/avatars')
const AVATARS_UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'img', 'avatars');

// Crea la carpeta de avatares si no existe (¡IMPORTANTE!)
if (!fs.existsSync(AVATARS_UPLOAD_DIR)) {
    fs.mkdirSync(AVATARS_UPLOAD_DIR, { recursive: true });
} else {
}

const avatarStorage = multer.diskStorage({ // Cambiado de 'storage' a 'avatarStorage' para claridad
    destination: function (req, file, cb) {
        cb(null, AVATARS_UPLOAD_DIR); // <--- ¡CORRECCIÓN CLAVE AQUÍ!
    },
    filename: function (req, file, cb) {
        // Define el nombre del archivo: userId-timestamp.extensión_original
        // 'req.user._id' viene del middleware 'protect'
        const userId = req.user ? req.user._id : 'unknown-user'; // Usar req.user._id si está disponible
        const fileExtension = path.extname(file.originalname);
        const fileName = `${userId}-${Date.now()}${fileExtension}`;
        cb(null, fileName);
    }
});

// Configuración principal de Multer para avatares
const uploadAvatar = multer({ // Cambiado de 'upload' a 'uploadAvatar' para evitar conflictos si tienes otro 'upload'
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de tamaño de archivo (Aumentado a 5 MB)
    fileFilter: function (req, file, cb) {
        // Filtrar tipos de archivo permitidos (solo imágenes)
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true); // Aceptar el archivo
        } else {
            // Rechazar el archivo y devolver un error personalizado
            cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, GIF) para avatares!'));
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
router.delete('/:id', protect, authorizeRoles('admin'), deleteUser);

// @route   PUT /api/users/:id/avatar
// @desc    Subir o actualizar el avatar del usuario
// @access  Private/User itself
// 'avatar' es el nombre del campo en el FormData que contiene el archivo
router.put('/:id/avatar', protect, uploadAvatar.single('avatar'), updateUserAvatar); // <--- Usar uploadAvatar

// @route   GET /api/users/:id/activity
// @desc    Obtener actividades de usuario (compras, carrito) (admin o el propio usuario)
// @access  Private/Admin or User itself
router.get('/:id/activity', protect, getUserActivity);

module.exports = router;