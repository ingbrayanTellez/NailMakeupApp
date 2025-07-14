// backend/models/Discount.js
const mongoose = require('mongoose');

const discountSchema = mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'Por favor, añade un código de descuento'],
            unique: true,
            trim: true,
            uppercase: true // Convertir a mayúsculas para consistencia
        },
        type: {
            type: String,
            required: [true, 'Por favor, selecciona un tipo de descuento'],
            enum: ['percentage', 'fixed'] // Porcentaje o cantidad fija
        },
        value: {
            type: Number,
            required: [true, 'Por favor, añade el valor del descuento'],
            min: 0 // El valor no puede ser negativo
        },
        minOrderAmount: {
            type: Number,
            default: 0, // Cantidad mínima de pedido para aplicar el descuento
            min: 0
        },
        expiryDate: {
            type: Date,
            default: null // Opcional: fecha de expiración
        },
        maxUses: {
            type: Number,
            default: null, // Opcional: número máximo de usos
            min: 1
        },
        usedCount: {
            type: Number,
            default: 0 // Contador de cuántas veces se ha usado
        },
        isActive: {
            type: Boolean,
            default: true // Si el descuento está activo o no
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Discount', discountSchema);