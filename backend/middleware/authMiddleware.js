// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // La ruta al modelo de usuario es crucial
const dotenv = require('dotenv');

dotenv.config();

// Middleware para proteger rutas
const protect = async (req, res, next) => {
    let token;

    // Comprueba si el token está presente en los headers de la solicitud
    // Generalmente se envía como: Authorization: Bearer TOKEN_JWT_AQUI
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtener el token del header (eliminar 'Bearer ')
            token = req.headers.authorization.split(' ')[1];

            // Verificar el token
            // jwt.verify(token, process.env.JWT_SECRET) decodifica y verifica el token.
            // Si es válido, devuelve el payload decodificado (que es { id: userId })
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Buscar al usuario por el ID que está en el token
            // .select('-password') excluye la contraseña del resultado
            req.user = await User.findById(decoded.id).select('-password');

            // Si el usuario no se encuentra (ej. fue eliminado), o el token no es válido,
            // req.user será null o undefined. Si el usuario existe, se adjunta al objeto request.
            if (!req.user) {
                res.status(401);
                throw new Error('No autorizado, token inválido o usuario no encontrado.');
            }

            // Pasar al siguiente middleware/ruta si el token es válido y el usuario existe
            next();
        } catch (error) {
            console.error('Error en el middleware de autenticación (protect):', error.message); // Añadido más contexto al log
            // Si el token no es válido (expiró, mal firmado, etc.)
            res.status(401);
            throw new Error('No autorizado, token fallido o expirado.');
        }
    } else { // Si no hay token en el header o no tiene el formato 'Bearer'
        res.status(401);
        throw new Error('No autorizado, no hay token o el formato es incorrecto.');
    }
};

// Middleware para roles específicos (opcional, pero útil para administradores)
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // req.user se define en el middleware 'protect'. Asegúrate de que 'protect' se ejecute antes de 'authorizeRoles'.
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Acceso denegado. Se requiere uno de los roles: ${roles.join(', ')}` });
        }
        next();
    };
};

module.exports = {
    protect,
    authorizeRoles,
};