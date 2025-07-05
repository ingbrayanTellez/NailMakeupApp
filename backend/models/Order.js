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
    imageUrl: { type: String }
});

const shippingInfoSchema = mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true }
});

const orderSchema = mongoose.Schema({
    userId: { // Cambiado de 'user' a 'userId' para consistencia con req.user.id
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Referencia al modelo User
    },
    items: [orderItemSchema],
    total: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingInfo: shippingInfoSchema,
    paymentMethod: {
        type: String,
        required: true
    },
    paymentStatus: { // Añadido para reflejar si el pago fue 'paid' o 'unpaid'
        type: String,
        enum: ['paid', 'unpaid', 'refunded'],
        default: 'paid'
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Añade createdAt y updatedAt automáticamente
});

module.exports = mongoose.model('Order', orderSchema);