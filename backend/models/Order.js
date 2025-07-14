// backend/models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product' // Referencia al modelo Product
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String } // URL de la imagen del producto en el momento del pedido
});

const orderSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true, // Un pedido siempre debe tener un usuario
            ref: 'User' // <--- ¡ASEGÚRATE DE QUE ESTA LÍNEA EXISTA Y SEA CORRECTA!
        },
        items: [orderItemSchema], // Array de ítems del pedido
        shippingInfo: {
            name: { type: String, required: true },
            address: { type: String, required: true },
            city: { type: String, required: true },
            country: { type: String, required: true },
            postalCode: { type: String }
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ['credit_card', 'paypal', 'cash_on_delivery'] // Métodos de pago permitidos
        },
        paymentDetails: {
            // Aquí puedes guardar detalles no sensibles como los últimos 4 dígitos de la tarjeta, etc.
            // NO GUARDES NÚMEROS DE TARJETA COMPLETOS O CVCs
            cardNumber: { type: String }, // Ej. '**** **** **** 1234'
            expiryDate: { type: String }, // Ej. '12/25'
            cardName: { type: String }
        },
        total: {
            type: Number,
            required: true,
            default: 0.0
        },
        status: {
            type: String,
            required: true,
            default: 'pending',
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        },
        paymentStatus: {
            type: String,
            required: true,
            default: 'pending',
            enum: ['pending', 'paid', 'refunded', 'failed']
        },
        paidAt: {
            type: Date
        },
        deliveredAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Order', orderSchema);