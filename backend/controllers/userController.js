// userController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Necesario para hashear contraseñas si se actualiza desde aquí
const path = require('path'); // Para trabajar con rutas de archivos
const fs = require('fs'); // Para manejar archivos (ej. eliminar avatares antiguos)

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
    // Importante: profileImage se manejará en una ruta separada con Multer.
    // Role se maneja en una ruta separada.
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
        profileImage: updatedUser.profileImage || '/images/default_avatar.png', // Asegurarse de incluir la imagen
        message: 'Perfil actualizado con éxito'
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
    // Aquí puedes decidir si quieres permitir que un admin cambie el rol de otro admin.
    // Por seguridad, es mejor que un admin no pueda degradar a otro admin o a sí mismo.
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

    // Opcional: Eliminar el archivo de imagen de perfil si no es la por defecto
    if (userToDelete.profileImage && userToDelete.profileImage !== '/images/default_avatar.png') {
        // Asegúrate de que esta ruta sea correcta para tu entorno de servidor
        const imagePath = path.join(__dirname, '../public', userToDelete.profileImage);
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error('Error al eliminar el archivo de imagen de perfil:', imagePath, err);
                // No lanzamos un error que impida la eliminación del usuario si la imagen falla
            }
        });
    }

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

    // Si ya existe una imagen de perfil y no es la predeterminada, eliminarla
    if (user.profileImage && user.profileImage !== '/images/default_avatar.png') {
        // Construye la ruta absoluta al archivo antiguo
        // Asegúrate de que esta ruta coincida con donde Multer guarda los archivos
        const oldImagePath = path.join(__dirname, '../public', user.profileImage);
        fs.unlink(oldImagePath, (err) => {
            if (err) {
                console.error('Error al eliminar el avatar antiguo:', oldImagePath, err);
                // Puedes decidir si este error debería detener la actualización
                // o simplemente loguearlo y continuar.
            }
        });
    }

    // Guardar la nueva ruta de la imagen en la base de datos
    // La ruta guardada debe ser relativa al cliente (lo que el navegador pedirá)
    // Multer típicamente proporciona req.file.path o req.file.filename
    // Asumimos que Multer guarda en 'public/uploads' y lo sirves desde '/uploads'
    user.profileImage = `/uploads/${req.file.filename}`; // Asume que Multer usa 'filename'

    await user.save();

    res.status(200).json({
        message: 'Avatar actualizado con éxito',
        profileImage: user.profileImage // Devolver la nueva URL de la imagen
    });
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