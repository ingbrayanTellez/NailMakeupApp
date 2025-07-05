// backend/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Esmaltes', 'Bases', 'Accesorios', 'Maquillaje'] // Asegúrate de que coincida con tus categorías
    },
    stock: { // <--- Asegúrate de que este campo exista
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    imageUrl: {
        type: String,
        default: '/img/placeholder.jpg' // Imagen por defecto si no se proporciona ninguna
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Para createdAt y updatedAt
});

module.exports = mongoose.model('Product', productSchema);
