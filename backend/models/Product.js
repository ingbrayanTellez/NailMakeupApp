// backend/models/Product.js
const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Por favor, añade el nombre del producto'],
            trim: true,
            maxlength: [100, 'El nombre del producto no puede exceder los 100 caracteres']
        },
        description: {
            type: String,
            required: [true, 'Por favor, añade una descripción del producto'],
            maxlength: [1000, 'La descripción del producto no puede exceder los 1000 caracteres']
        },
        price: {
            type: Number,
            required: [true, 'Por favor, añade el precio del producto'],
            min: [0, 'El precio no puede ser negativo']
        },
        category: {
            type: String,
            required: [true, 'Por favor, selecciona una categoría para este producto']
            // Puedes añadir un enum si tienes categorías fijas, o referenciar un modelo Category
        },
        stock: {
            type: Number,
            required: [true, 'Por favor, añade el stock disponible'],
            min: [0, 'El stock no puede ser negativo'],
            default: 0
        },
        imageUrl: {
            type: String,
            default: '/img/placeholder.png' // Imagen por defecto
        },
        user: { // <--- ¡ASEGÚRATE DE QUE ESTA LÍNEA EXISTA SI ESTÁS POPULANDO 'user' EN PRODUCTOS!
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false // Puede ser true si siempre quieres un usuario asociado al producto
        }
    },
    {
        timestamps: true // Añade createdAt y updatedAt
    }
);

module.exports = mongoose.model('Product', productSchema);