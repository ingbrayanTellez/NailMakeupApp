const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Importa bcryptjs para hashing de contraseñas

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, 'El nombre de usuario es requerido'],
        unique: true, // Asegura que el nombre de usuario sea único
        trim: true, // Elimina espacios en blanco al principio y al final
        minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
        maxlength: [30, 'El nombre de usuario no puede exceder los 30 caracteres']
    },
    email: {
        type: String,
        required: [true, 'El email es requerido'],
        unique: true, // Asegura que el email sea único
        trim: true,
        lowercase: true, // Guarda el email en minúsculas
        match: [/.+@.+\..+/, 'Por favor, ingresa un email válido'] // Valida formato de email
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    role: {
        type: String,
        enum: ['user', 'admin'], // Define roles permitidos
        default: 'user' // Rol por defecto
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Añade automáticamente `createdAt` y `updatedAt`
});

// =====================================================================
// Middleware de Mongoose (pre-save hook)
// =====================================================================
// Antes de guardar un usuario, si la contraseña ha sido modificada o es nueva,
// la hashea. Esto protege las contraseñas en la base de datos.
userSchema.pre('save', async function (next) {
    // Solo hashea la contraseña si ha sido modificada (o es nueva)
    if (!this.isModified('password')) {
        return next(); // Pasa al siguiente middleware (o guarda)
    }

    try {
        // Genera un "salt" (una cadena aleatoria) para el hashing
        // Cuanto mayor el número, más seguro, pero más lento. 10 es un buen balance.
        const salt = await bcrypt.genSalt(10);

        // Hashea la contraseña con el salt generado
        this.password = await bcrypt.hash(this.password, salt);
        next(); // Continúa con el proceso de guardado
    } catch (error) {
        console.error('Error al hashear la contraseña:', error.message);
        next(error); // Pasa el error al siguiente manejador de errores
    }
});

// =====================================================================
// Métodos de instancia de Mongoose (para comparar contraseñas)
// =====================================================================
// Este método estará disponible en cualquier instancia de un documento User.
// Permite comparar una contraseña ingresada con la contraseña hasheada almacenada.
userSchema.methods.matchPassword = async function (enteredPassword) {
    // Compara la contraseña ingresada con la contraseña hasheada del usuario.
    // bcrypt.compare() maneja automáticamente el salt.
    return await bcrypt.compare(enteredPassword, this.password);
};

// Crea el modelo a partir del esquema
const User = mongoose.model('User', userSchema);

module.exports = User;