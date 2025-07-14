// backend/models/Category.js
const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Por favor, añade un nombre para la categoría'],
            unique: true, // Asegura que los nombres de categoría sean únicos
            trim: true, // Elimina espacios en blanco al inicio y al final
            maxlength: [50, 'El nombre de la categoría no puede exceder los 50 caracteres']
        }
    },
    {
        timestamps: true // Añade campos createdAt y updatedAt automáticamente
    }
);

module.exports = mongoose.model('Category', categorySchema);