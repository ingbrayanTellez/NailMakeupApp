// backend/app.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const path = require('path');
const fs = require('fs');

// --- Importar modelos de Mongoose para el Carrito y Producto ---
// RUTA CORREGIDA: Asume que tus modelos están en 'backend/models/'
const Cart = require('./models/Cart'); 
const Product = require('./models/Product');


dotenv.config();

const app = express();

// Configura Express para servir archivos estáticos desde la carpeta 'public'
// Asegúrate de que 'public' está un nivel arriba de 'backend'
const publicPath = path.join(__dirname, '../public'); 
app.use(express.static(publicPath));


const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('Error: MONGO_URI no está definida en el archivo .env. Asegúrate de que el archivo .env exista y la variable esté configurada.');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Conectado...');
    } catch (err) {
        console.error('Error al conectar a MongoDB:', err.message);
        process.exit(1);
    }
};
connectDB();

app.use(express.json()); // Middleware para parsear cuerpos de solicitud JSON
app.use(express.urlencoded({ extended: true })); // Middleware para parsear cuerpos de solicitud URL-encoded


const uploadsDir = path.join(publicPath, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const indexPath = path.resolve(publicPath, 'index.html');

app.get('/', (req, res) => {
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error al enviar index.html:', err.message);
            res.status(500).send('Error al cargar la página principal.');
        }
    });
});

// --- Middleware de Autenticación SIMULADO para las rutas del carrito ---
// Este es un PLACEHOLDER. DEBES REEMPLAZARLO con tu lógica de autenticación REAL.
// Por ejemplo, si usas JWTs, aquí verificarías el token y obtendrías el ID del usuario.
const authMiddleware = (req, res, next) => {
    // Ejemplo de cómo obtendrías el ID del usuario de un token JWT o de una sesión real
    // const token = req.headers.authorization?.split(' ')[1];
    // if (!token) return res.status(401).json({ message: 'No autenticado: Token no proporcionado.' });
    // try {
    //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //     req.user = { id: decoded.id, role: decoded.role }; // Asume que tu token JWT guarda id y rol
    //     next();
    // } catch (error) {
    //     return res.status(403).json({ message: 'No autorizado: Token inválido.' });
    // }

    // Por ahora, para pruebas, simulamos un usuario con un ID fijo:
    req.user = { id: '60c72b2f90a5b6c7d8e9f0a1', role: 'user' }; // ID y rol de usuario de ejemplo
    // Para probar como no logueado, comenta la línea de arriba y descomenta la de abajo:
    // req.user = null;

    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'No autenticado. Por favor, inicie sesión.' });
    }
    next();
};

// --- Rutas API existentes ---
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);


// --- Rutas API para el Carrito (AÑADIDAS) ---

// 1. Obtener el carrito del usuario autenticado
app.get('/api/cart', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        // Populate 'items.productId' para obtener detalles completos del producto
        let cart = await Cart.findOne({ userId }).populate('items.productId'); 
        
        if (!cart) {
            // Si el carrito no existe para este usuario, lo creamos vacío
            cart = new Cart({ userId, items: [] });
            await cart.save();
        }
        res.status(200).json(cart);
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el carrito.' });
    }
});

// 2. Añadir un producto al carrito (o actualizar cantidad si ya existe)
app.post('/api/cart', authMiddleware, async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'ID de producto y cantidad válidos son requeridos.' });
    }

    try {
        let cart = await Cart.findOne({ userId });
        const product = await Product.findById(productId); // Busca el producto en tu colección de productos

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        if (!cart) {
            // Si el usuario no tiene carrito, creamos uno nuevo
            cart = new Cart({ userId, items: [] });
        }

        // Verificar si el producto ya está en el carrito
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            // Si el producto ya está, actualizamos la cantidad
            cart.items[itemIndex].quantity += quantity;
            // Opcional: Asegurarse de que el precio, nombre e imagen se mantengan actualizados por si cambiaron en la base de datos
            cart.items[itemIndex].name = product.name;
            cart.items[itemIndex].price = product.price;
            cart.items[itemIndex].imageUrl = product.imageUrl;
        } else {
            // Si el producto no está, lo añadimos
            cart.items.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                imageUrl: product.imageUrl // Guarda la URL de la imagen en el carrito
            });
        }

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        console.error('Error al añadir producto al carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al añadir producto al carrito.' });
    }
});

// 3. Actualizar cantidad de un producto en el carrito (la cantidad es la NUEVA cantidad deseada)
app.put('/api/cart/update-quantity', authMiddleware, async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || quantity === undefined || quantity < 0) {
        return res.status(400).json({ message: 'ID de producto y cantidad válidos son requeridos.' });
    }

    try {
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado para este usuario.' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            if (quantity === 0) {
                // Si la cantidad es 0, eliminamos el ítem del carrito
                cart.items.splice(itemIndex, 1);
            } else {
                // Si no, actualizamos la cantidad
                cart.items[itemIndex].quantity = quantity;
            }
            await cart.save();
            res.status(200).json(cart);
        } else {
            return res.status(404).json({ message: 'Producto no encontrado en el carrito.' });
        }
    } catch (error) {
        console.error('Error al actualizar la cantidad del producto en el carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el carrito.' });
    }
});

// 4. Eliminar un producto del carrito
app.delete('/api/cart/:productId', authMiddleware, async (req, res) => {
    const { productId } = req.params;
    const userId = req.user.id;

    try {
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado para este usuario.' });
        }

        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        if (cart.items.length === initialLength) {
            // Esto significa que el filter no encontró el producto y la longitud del array no cambió
            return res.status(404).json({ message: 'Producto no encontrado en el carrito para eliminar.' });
        }

        await cart.save();
        res.status(200).json({ message: 'Producto eliminado del carrito exitosamente.', cart });
    } catch (error) {
        console.error('Error al eliminar producto del carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar producto del carrito.' });
    }
});


// --- Manejo de errores existentes ---
app.use((req, res, next) => {
    res.status(404).send('Lo siento, no se pudo encontrar esa página.');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        message: err.message || 'Error interno del servidor',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));

module.exports = app;
