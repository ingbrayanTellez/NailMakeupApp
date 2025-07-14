const express = require('express');
const router = express.Router();
const path = require('path'); // Necesario para Multer y rutas de archivos
const fs = require('fs');     // Necesario para crear carpetas con Multer
const multer = require('multer'); // Importa Multer

// Importa las funciones del controlador de usuarios
const {
    getUsers,
    getUserById,
    getMe, // <--- ¡AÑADIDO: Importa la nueva función getMe!
    updateUserProfile,
    updateUserRole,
    deleteUser,
    updateUserAvatar, // Función de avatar
    changePassword, // Asegúrate de importar changePassword si tu controlador lo exporta
    getUserActivity, // Asegúrate de importar getUserActivity si tu controlador lo exporta
    toggleUserStatus // <--- ¡NUEVO: Importa la función para cambiar estado del usuario!
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
const AVATAR_UPLOAD_DIR = path.join(__dirname, '../../public/img/avatars');

// Crea el directorio de avatares si no existe
if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
    fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
}

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, AVATAR_UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Genera un nombre de archivo único con la extensión original
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB límite de tamaño
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'), false);
        }
    }
});

// =====================================================================
// DEFINICIÓN DE RUTAS DE USUARIO
// =====================================================================

// @route   GET /api/users/me
// @desc    Obtener el perfil del usuario autenticado
// @access  Private
router.get('/me', protect, getMe);

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
router.put('/:id', protect, updateUserProfile);

// @route   PUT /api/users/:id/role
// @desc    Actualizar el rol de un usuario (solo administradores)
// @access  Private/Admin
router.put('/:id/role', protect, authorizeRoles('admin'), updateUserRole);

// @route   PUT /api/users/:id/status
// @desc    Cambiar el estado de un usuario (activo/inactivo, bloqueado/desbloqueado)
// @access  Private/Admin
router.put('/:id/status', protect, authorizeRoles('admin'), toggleUserStatus); // <--- ¡NUEVA RUTA!

// @route   DELETE /api/users/:id
// @desc    Eliminar un usuario (solo administradores)
// @access  Private/Admin
router.delete('/:id', protect, authorizeRoles('admin'), deleteUser);

// @route   PUT /api/users/:id/avatar
// @desc    Subir o actualizar el avatar del usuario
// @access  Private/User itself
router.put('/:id/avatar', protect, uploadAvatar.single('avatar'), updateUserAvatar);

// @route   PUT /api/users/:id/password
// @desc    Cambiar la contraseña del usuario
// @access  Private/User itself
router.put('/:id/password', protect, changePassword); // Asegúrate de que changePassword está importado

// @route   GET /api/users/:id/activity
// @desc    Obtener la actividad de un usuario (ej. historial de pedidos, inicios de sesión)
// @access  Private/Admin o el propio usuario
router.get('/:id/activity', protect, authorizeRoles('admin'), getUserActivity); // <--- ¡NUEVA RUTA!

module.exports = router;
