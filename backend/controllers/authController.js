const User = require('../models/User'); // Asegúrate de que esta ruta sea correcta
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Necesario para el hashing y comparación de contraseñas

// Helper function to generate a JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h', // Usa la variable de entorno o un default
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Por favor, ingresa todos los campos requeridos.' });
        }

        let userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'Ya existe un usuario con ese email o nombre de usuario.' });
        }

        const newUser = new User({
            username,
            email,
            password,
        });

        // La contraseña se hashea en el pre-save hook de Mongoose si lo tienes configurado
        await newUser.save();

        res.status(201).json({
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            token: generateToken(newUser._id),
            message: 'Registro exitoso'
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error del servidor al registrar usuario' });
    }
};

// @desc    Authenticate user and get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Por favor, ingresa email y contraseña.' });
        }

        const user = await User.findOne({ email });

        // Asumiendo que `user.matchPassword` está definido en tu modelo de usuario
        if (user && (await user.matchPassword(password))) {
            return res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
                message: 'Login exitoso'
            });
        } else {
            return res.status(401).json({ message: 'Credenciales inválidas (email o contraseña incorrectos)' });
        }

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error del servidor al iniciar sesión' });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    // req.user viene del middleware 'protect', contiene el ID del usuario
    try {
        const user = await User.findById(req.user._id).select('-password'); // Busca en DB y excluye la contraseña

        if (user) {
            res.status(200).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            });
        } else {
            // Esto debería ser un 400 si el ID del usuario en el token no se encuentra en DB
            res.status(400).json({ message: 'Usuario no encontrado.' });
        }
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        res.status(500).json({ message: 'Error del servidor al obtener datos del usuario.' });
    }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Por favor, ingresa tu contraseña actual y la nueva contraseña.' });
    }

    try {
        // Necesitamos seleccionar explícitamente la contraseña para compararla
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Verifica que la contraseña actual sea correcta
        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
        }

        // Hashea la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Guarda el usuario con la nueva contraseña hasheada
        await user.save();

        res.status(200).json({ message: 'Contraseña actualizada con éxito.' });

    } catch (error) {
        console.error('Error al cambiar la contraseña:', error);
        res.status(500).json({ message: 'Error del servidor al cambiar la contraseña.' });
    }
};