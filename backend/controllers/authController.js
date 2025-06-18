// backend/controllers/authController.js
const User = require('../models/User'); // Asegúrate de que esta ruta sea correcta
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Solo si lo usas en el controlador, si no, puedes omitirlo
// const { validationResult } = require('express-validator'); // Solo si usas express-validator aquí

// Helper function to generate a JWT token (asegúrate de que esta función esté aquí)
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // O el tiempo que tengas configurado
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    // ... (tu código existente para registerUser) ...
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
    // ... (tu código existente para loginUser) ...
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Por favor, ingresa email y contraseña.' });
        }

        const user = await User.findOne({ email });

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

// @desc    Obtener información del usuario autenticado
// @route   GET /api/auth/me
// @access  Private
exports.getMe = (req, res) => {
    // El middleware 'protect' ya ha adjuntado la información del usuario
    // al objeto req.user si el token es válido.
    if (req.user) {
        res.status(200).json({
            _id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role // Esto es clave para el frontend
        });
    } else {
        // Esto no debería ocurrir si 'protect' funciona correctamente,
        // pero es una salvaguarda.
        res.status(404).json({ message: 'Usuario no encontrado.' });
    }
};