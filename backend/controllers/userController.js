const asyncHandler = require('express-async-handler');
const User = require('../models/User'); // Asegúrate de que la ruta al modelo es correcta
const bcrypt = require('bcryptjs'); 
const path = require('path');
const fs = require('fs');

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
            { username: { $regex: searchTerm, $options: 'i' } }, // 'i' para case-insensitive
            { email: { $regex: searchTerm, $options: 'i' } }
        ];
    }

    try {
        const count = await User.countDocuments(query); // Contar el total de usuarios que coinciden con el filtro
        const users = await User.find(query)
            .select('-password') // Excluir contraseñas
            .limit(pageSize)      // Limitar el número de resultados
            .skip(pageSize * (page - 1)); // Saltar los resultados de páginas anteriores

        res.status(200).json({
            users: users,
            page: page,
            pages: Math.ceil(count / pageSize), // Total de páginas
            totalUsers: count,
            currentPage: page, // Coincide con el nombre esperado en el frontend
            totalPages: Math.ceil(count / pageSize) // Coincide con el nombre esperado en el frontend
        });

    } catch (error) {
        console.error('Error fetching users for admin:', error);
        res.status(500).json({ message: 'Error del servidor al obtener usuarios.' });
    }
});

// @desc    Get a single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin or User itself
exports.getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    // Permitir acceso si es el propio usuario o un administrador
    if (req.user._id.toString() === user._id.toString() || req.user.role === 'admin') {
        res.status(200).json(user);
    } else {
        res.status(403);
        throw new Error('No autorizado para ver este perfil de usuario');
    }
});

// @desc    Get logged in user profile
// @route   GET /api/users/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
    // req.user viene del middleware 'protect' y contiene la información del usuario autenticado
    console.log('DEBUG: getMe - req.user:', req.user); // Log para depuración

    if (!req.user || !req.user._id) {
        res.status(401);
        throw new Error('No autorizado. Usuario no autenticado.');
    }

    // Busca al usuario usando el ID del token (req.user._id)
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado en la base de datos.');
    }

    res.status(200).json(user);
});


// @desc    Update user profile (self or by admin)
// @route   PUT /api/users/:id
// @access  Private/Admin or User itself
exports.updateUserProfile = asyncHandler(async (req, res) => {
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    // Asegurarse de que el usuario que intenta actualizar sea el propio usuario
    // O que el usuario que intenta actualizar sea un administrador
    if (req.user._id.toString() !== userToUpdate._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('No autorizado para actualizar este perfil');
    }

    // Campos que se pueden actualizar.
    const { username, email } = req.body;

    // Actualizar campos si se proporcionan
    if (username !== undefined) {
        userToUpdate.username = username;
    }
    if (email !== undefined) {
        userToUpdate.email = email;
    }

    const updatedUser = await userToUpdate.save();

    res.status(200).json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage || '/img/default-avatar.png', // Asegúrate de que el frontend reciba la ruta completa
        message: 'Perfil actualizado con éxito',
        user: updatedUser // Devolver el objeto de usuario actualizado para el frontend
    });
});


// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = asyncHandler(async (req, res) => {
    // Solo permitir si el usuario logueado es admin
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('No autorizado. Solo administradores pueden cambiar roles.');
    }

    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    // Un administrador no debe poder cambiar su propio rol o el rol de otro administrador
    if (req.user._id.toString() === userToUpdate._id.toString()) {
        res.status(400);
        throw new Error('No puedes cambiar tu propio rol.');
    }
    // Si quieres evitar que un admin cambie el rol de otro admin:
    if (userToUpdate.role === 'admin' && req.user._id.toString() !== userToUpdate._id.toString()) {
        res.status(400);
        throw new Error('No puedes cambiar el rol de otro administrador.');
    }

    const { role } = req.body;

    // Validar el nuevo rol
    const validRoles = ['user', 'admin']; // Define tus roles válidos
    if (!validRoles.includes(role)) {
        res.status(400);
        throw new Error('Rol inválido. Los roles permitidos son: ' + validRoles.join(', '));
    }

    userToUpdate.role = role;
    const updatedUser = await userToUpdate.save();

    res.status(200).json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        message: `Rol de ${updatedUser.username} actualizado a ${updatedUser.role}`
    });
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
    // Solo permitir si el usuario logueado es admin
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('No autorizado. Solo administradores pueden eliminar usuarios.');
    }

    const userToDelete = await User.findById(req.params.id);

    if (!userToDelete) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    // Un administrador no debe poder eliminarse a sí mismo
    if (req.user._id.toString() === userToDelete._id.toString()) {
        res.status(400);
        throw new Error('No puedes eliminar tu propia cuenta de administrador.');
    }

    // === INICIO DE CORRECCIÓN PARA LA ELIMINACIÓN DEL AVATAR ANTIGUO ===
    // Asumimos que '/img/default-avatar.png' es la ruta que se guarda en la DB
    // para el avatar por defecto. Ajusta si tu default es solo 'default-avatar.png'
    if (userToDelete.profileImage && userToDelete.profileImage !== '/img/default-avatar.png') {
        let filenameToUnlink = userToDelete.profileImage;

        // Si profileImage ya tiene la ruta completa (ej. '/img/avatars/filename.ext'),
        // extraemos solo el nombre del archivo. Esto maneja la consistencia con las rutas antiguas.
        if (filenameToUnlink.startsWith('/img/avatars/')) {
            filenameToUnlink = path.basename(filenameToUnlink);
        }

        // Construye la ruta absoluta al archivo antiguo en `public/img/avatars/`
        // path.join(__dirname, '..', '..') te lleva a la raíz del proyecto.
        // Desde ahí, 'public', 'img', 'avatars' y luego el nombre del archivo.
        const oldImagePath = path.join(__dirname, '..', '..', 'public', 'img', 'avatars', filenameToUnlink);
        
        try {
            await fs.promises.unlink(oldImagePath);
            console.log(`Avatar antiguo eliminado: ${oldImagePath}`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn(`Advertencia: Archivo de perfil no encontrado al intentar eliminar: ${oldImagePath}`);
            } else {
                console.error('Error al eliminar el archivo de imagen de perfil:', oldImagePath, error);
            }
        }
    }
    // === FIN DE CORRECCIÓN ===

    await userToDelete.deleteOne(); // Mongoose 6+ usa deleteOne(), en versiones anteriores era remove()

    res.status(200).json({ message: 'Usuario eliminado con éxito.' });
});

// @desc    Upload or update user avatar
// @route   PUT /api/users/:id/avatar
// @access  Private/User itself
exports.updateUserAvatar = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    // Verificar si el usuario que sube el avatar es el dueño del perfil
    if (req.user._id.toString() !== userId.toString()) {
        res.status(403);
        throw new Error('No autorizado para actualizar el avatar de este usuario.');
    }

    // req.file contiene la información del archivo subido por Multer
    if (!req.file) {
        res.status(400);
        throw new Error('No se ha proporcionado ningún archivo para el avatar.');
    }

    // === INICIO DE CORRECCIÓN PARA LA ELIMINACIÓN DEL AVATAR ANTIGUO ===
    // Si ya existe una imagen de perfil y NO es la predeterminada, eliminarla
    // Asumimos que '/img/default-avatar.png' es la ruta que se guarda en la DB
    // para el avatar por defecto. Ajusta si tu default es solo 'default-avatar.png'
    if (user.profileImage && user.profileImage !== '/img/default-avatar.png') { 
        let filenameToUnlink = user.profileImage;

        // Si profileImage ya tiene la ruta completa (ej. '/img/avatars/filename.ext'),
        // extraemos solo el nombre del archivo. Esto maneja la consistencia con las rutas antiguas.
        if (filenameToUnlink.startsWith('/img/avatars/')) {
            filenameToUnlink = path.basename(filenameToUnlink);
        }

        // Construye la ruta absoluta al archivo antiguo en `public/img/avatars/`
        // path.join(__dirname, '..', '..') te lleva a la raíz del proyecto.
        // Desde ahí, 'public', 'img', 'avatars' y luego el nombre del archivo.
        const oldImagePath = path.join(__dirname, '..', '..', 'public', 'img', 'avatars', filenameToUnlink);
        
        // Usar fs.promises.unlink para un manejo asíncrono y evitar errores no capturados
        try {
            await fs.promises.unlink(oldImagePath);
            console.log(`Avatar antiguo eliminado: ${oldImagePath}`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn(`Advertencia: Avatar antiguo no encontrado al intentar eliminar: ${oldImagePath}`);
            } else {
                console.error('Error al eliminar el avatar antiguo:', oldImagePath, error);
            }
        }
    }
    // === FIN DE CORRECCIÓN ===

    // Guardar la RUTA RELATIVA COMPLETA del avatar en la base de datos.
    // Esto es lo que el frontend usará para el 'src' de la imagen.
    user.profileImage = `/img/avatars/${req.file.filename}`; // <--- ¡LA CORRECCIÓN CLAVE!

    await user.save();

    res.status(200).json({
        message: 'Avatar actualizado con éxito',
        avatarUrl: user.profileImage // Devolver la ruta relativa completa al frontend
    });
});

// @desc    Update user password
// @route   PUT /api/users/:id/password
// @access  Private/User itself
exports.changePassword = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    // Verificar si el usuario que intenta cambiar la contraseña es el dueño del perfil
    if (req.user._id.toString() !== userId.toString()) {
        res.status(403);
        throw new Error('No autorizado para cambiar la contraseña de este usuario.');
    }

    const { email, oldPassword, newPassword } = req.body;

    // Validar que se proporcionen las contraseñas
    if (!oldPassword || !newPassword) {
        res.status(400);
        throw new Error('Por favor, proporciona la contraseña actual y la nueva contraseña.');
    }

    // Validar que el email proporcionado coincide con el del usuario
    if (user.email !== email) {
        res.status(400);
        throw new Error('El email proporcionado no coincide con el usuario actual.');
    }

    // Verificar la contraseña actual
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        res.status(401);
        throw new Error('La contraseña actual es incorrecta.');
    }

    // Validar la nueva contraseña (ej. longitud mínima)
    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({ message: 'Contraseña actualizada con éxito.' });
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
        .select('purchases cartActivity') // Seleccionar solo los campos de actividad
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
        cartActivity: user.cartActivity || [],
        message: 'Datos de actividad cargados.'
    };

    res.status(200).json(userActivity);
});
