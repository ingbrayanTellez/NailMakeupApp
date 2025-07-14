// backend/controllers/userController.js
const asyncHandler = require('express-async-handler'); // Para manejar errores asíncronos sin bloques try-catch repetitivos
const User = require('../models/User'); // Asegúrate de que la ruta a tu modelo User sea correcta
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas
const path = require('path'); // Para manejar rutas de archivos
const fs = require('fs');     // Para manejar el sistema de archivos (ej. eliminar avatares antiguos)

// @desc    Get all users (for admin panel)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
    // Solo permitir si el usuario logueado es admin
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('No autorizado. Solo administradores pueden ver todos los usuarios.');
    }

    const pageSize = parseInt(req.query.limit) || 10; // Número de usuarios por página
    const page = parseInt(req.query.page) || 1;       // Página actual
    const searchTerm = req.query.search ? req.query.search.toLowerCase() : ''; // Término de búsqueda
    const roleFilter = req.query.role || '';         // Filtro por rol

    let query = {}; // Objeto para construir la consulta de Mongoose

    // Aplicar filtro por rol si se proporciona
    if (roleFilter && (roleFilter === 'user' || roleFilter === 'admin')) {
        query.role = roleFilter;
    }

    // Aplicar búsqueda por username o email si se proporciona un término de búsqueda
    if (searchTerm) {
        query.$or = [
            { username: { $regex: searchTerm, $options: 'i' } }, // Búsqueda insensible a mayúsculas/minúsculas
            { email: { $regex: searchTerm, $options: 'i' } }
        ];
    }

    const count = await User.countDocuments(query);
    const users = await User.find(query)
        .select('-password') // Excluir la contraseña
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.status(200).json({
        users,
        page,
        pages: Math.ceil(count / pageSize),
        totalUsers: count
    });
});

// @desc    Get user by ID (for admin or user itself)
// @route   GET /api/users/:id
// @access  Private/Admin or User itself
exports.getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    // Permitir acceso si es el propio usuario o un administrador
    if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('No autorizado para ver este perfil.');
    }

    res.status(200).json(user);
});

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
    // req.user viene del middleware 'protect'
    const user = await User.findById(req.user._id).select('-password'); // No enviar la contraseña

    if (user) {
        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl, // Asegúrate de que tu modelo User tenga un campo avatarUrl
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } else {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private/Admin or User itself
exports.updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    // Permitir actualización si es el propio usuario o un administrador
    if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('No autorizado para actualizar este perfil.');
    }

    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;

    // Solo un admin puede cambiar el rol a través de esta ruta (aunque hay una ruta específica para ello)
    if (req.user.role === 'admin' && req.body.role) {
        user.role = req.body.role;
    }

    const updatedUser = await user.save();

    res.status(200).json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
        isActive: updatedUser.isActive
    });
});

// @desc    Update user role (only for administrators)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    const { role } = req.body;

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    if (!role || (role !== 'user' && role !== 'admin')) {
        res.status(400);
        throw new Error('El rol debe ser "user" o "admin".');
    }

    // Evitar que un admin cambie su propio rol si es el único admin
    if (user.role === 'admin' && role === 'user' && user._id.toString() === req.user._id.toString()) {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
            res.status(403);
            throw new Error('No puedes degradar tu propio rol si eres el único administrador.');
        }
    }

    user.role = role;
    const updatedUser = await user.save();

    res.status(200).json({
        message: `Rol de usuario actualizado a ${updatedUser.role}.`,
        user: {
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role
        }
    });
});

// @desc    Toggle user status (activate/deactivate)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
exports.toggleUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params; // ID del usuario a modificar
    const { isActive } = req.body; // Nuevo estado (true/false)

    // Validar que isActive sea un booleano
    if (typeof isActive !== 'boolean') {
        res.status(400);
        throw new Error('El campo isActive debe ser un booleano.');
    }

    // Buscar el usuario y actualizar su estado isActive
    const user = await User.findById(id);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    // Opcional: Evitar que un admin se desactive a sí mismo si no hay otros admins
    if (user.role === 'admin' && isActive === false && user._id.toString() === req.user._id.toString()) {
        const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
        if (adminCount <= 1) { // Si solo queda este admin activo
            res.status(403);
            throw new Error('No puedes desactivar tu propia cuenta de administrador si eres el único administrador activo.');
        }
    }
    
    user.isActive = isActive;
    await user.save();

    res.status(200).json({ 
        message: `Usuario ${user.username} ha sido ${isActive ? 'activado' : 'desactivado'} exitosamente.`, 
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            avatarUrl: user.avatarUrl // Incluir el avatar si existe
        }
    });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    // Evitar que un admin se elimine a sí mismo si es el único admin
    if (user.role === 'admin' && user._id.toString() === req.user._id.toString()) {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
            res.status(403);
            throw new Error('No puedes eliminar tu propia cuenta de administrador si eres el único administrador.');
        }
    }

    // Eliminar el avatar del usuario si existe
    if (user.avatarUrl && user.avatarUrl !== '/img/default-avatar.png') {
        const avatarPath = path.join(__dirname, '..', '..', 'public', user.avatarUrl);
        fs.unlink(avatarPath, (err) => {
            if (err) console.error('Error al eliminar avatar antiguo:', err);
        });
    }

    await user.deleteOne(); // Usar deleteOne() para eliminar el documento

    res.status(200).json({ message: 'Usuario eliminado exitosamente.' });
});

// @desc    Upload or update user avatar
// @route   PUT /api/users/:id/avatar
// @access  Private/User itself
exports.updateUserAvatar = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    // Permitir actualización si es el propio usuario
    if (req.user._id.toString() !== user._id.toString()) {
        res.status(403);
        throw new Error('No autorizado para actualizar este avatar.');
    }

    if (req.file) {
        // Eliminar el avatar antiguo si no es el avatar por defecto
        if (user.avatarUrl && user.avatarUrl !== '/img/default-avatar.png') {
            const oldAvatarPath = path.join(__dirname, '..', '..', 'public', user.avatarUrl);
            fs.unlink(oldAvatarPath, (err) => {
                if (err) console.error('Error al eliminar avatar antiguo:', err);
            });
        }
        // Guardar la nueva URL del avatar
        user.avatarUrl = `/img/avatars/${req.file.filename}`;
        await user.save();
        res.status(200).json({ message: 'Avatar actualizado exitosamente.', avatarUrl: user.avatarUrl });
    } else {
        res.status(400);
        throw new Error('No se ha subido ningún archivo.');
    }
});

// @desc    Change user password
// @route   PUT /api/users/:id/password
// @access  Private/User itself
exports.changePassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    const { currentPassword, newPassword } = req.body;

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    // Permitir cambio de contraseña si es el propio usuario
    if (req.user._id.toString() !== user._id.toString()) {
        res.status(403);
        throw new Error('No autorizado para cambiar la contraseña de este usuario.');
    }

    // Verificar la contraseña actual
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
        res.status(401);
        throw new Error('Contraseña actual incorrecta.');
    }

    // Validar la nueva contraseña (ej. longitud mínima)
    if (!newPassword || newPassword.length < 6) {
        res.status(400);
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    // Encriptar y guardar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Contraseña actualizada exitosamente.' });
});

// @desc    Get user activity (purchases and cart)
// @route   GET /api/users/:id/activity
// @access  Private/Admin or User itself
exports.getUserActivity = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    // Permitir acceso si es el propio usuario o un administrador
    if (req.user._id.toString() !== userId.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('No autorizado para ver la actividad de este usuario.');
    }

    const user = await User.findById(userId)
        .select('purchases cartActivity') // Seleccionar solo los campos de actividad relevantes
        // Si 'purchases' es una referencia a 'Order', podrías usar .populate('purchases') aquí
        // para obtener los detalles completos de las compras.
        .lean(); // .lean() para obtener un objeto JS plano y no un documento Mongoose, es más rápido para lectura.

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    // Aquí simplemente devolvemos lo que ya está en el modelo de usuario.
    // Si tu lógica de compras y carrito es más compleja y vive en otros modelos,
    // tendrías que consultarlos aquí y agregarlos a `userActivity`.
    const userActivity = {
        purchases: user.purchases || [],
        cartActivity: user.cartActivity || [], // Asumiendo que tienes un campo cartActivity en tu modelo User
    };

    res.status(200).json(userActivity);
});
