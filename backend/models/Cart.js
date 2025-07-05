const mongoose = require('mongoose');

// Define el esquema para un ítem individual dentro del carrito
const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId, // Referencia al ID del producto
        required: true,
        ref: 'Product' // Asumiendo que tienes un modelo 'Product'
    },
    // Eliminamos 'required: true' de name, price, imageUrl.
    // Estos campos serán populados del modelo Product cuando se consulte el carrito.
    name: {
        type: String // Ya no es requerido aquí, se obtiene del Product al popular
    },
    price: {
        type: Number,
        min: 0 // Ya no es requerido aquí, se obtiene del Product al popular
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    imageUrl: {
        type: String // Ya no es requerido aquí, se obtiene del Product al popular
    }
});

// Define el esquema principal del carrito
const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Referencia al ID del usuario
        required: true,
        unique: true, // Cada usuario solo debe tener un carrito activo
        ref: 'User' // Asumiendo que tienes un modelo 'User'
    },
    items: [cartItemSchema], // Un array de los ítems en el carrito
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware para actualizar 'updatedAt' antes de cada guardado
cartSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Cart', cartSchema);
