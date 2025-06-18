const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true, // Asumo que los nombres de productos deben ser únicos
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            default: 0,
        },
        imageUrl: {
            type: String,
            default: '/img/placeholder.png', // Una imagen por defecto si no se sube ninguna
        },
        category: { // <-- Campo para la categoría
            type: String,
            required: true,
            default: 'General'
        },
        stock: {    // <-- Campo para el stock
            type: Number,
            required: true,
            default: 0
        },
    },
    {
        timestamps: true, // Añade campos `createdAt` y `updatedAt` automáticamente
    }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;