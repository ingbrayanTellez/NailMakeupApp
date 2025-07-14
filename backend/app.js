const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Carga las variables de entorno
dotenv.config();

const app = express();

// =======================================================
// MIDDLEWARE GLOBAL (COLOCAR AL PRINPIO)
// Estos deben ir ANTES de definir tus rutas
// =======================================================

// Permite a Express leer JSON del body de las solicitudes
app.use(express.json());
// Permite a Express leer datos de formularios URL-encoded
app.use(express.urlencoded({ extended: true }));

// Definición correcta de publicPath (una sola vez)
// Si app.js está en 'backend/', entonces 'public' está un nivel arriba
const publicPath = path.join(__dirname, '../public'); 

// Sirve archivos estáticos desde la carpeta 'public' (FRONTEND)
// Es importante que esta ruta estática apunte correctamente
app.use(express.static(publicPath));

// Asegúrate de que el directorio de 'uploads' exista
// Esto es para las imágenes de productos y avatares
const uploadsDir = path.join(publicPath, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// =======================================================
// CONEXIÓN A LA BASE DE DATOS
// =======================================================
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('Error: MONGO_URI no está definida en el archivo .env. Asegúrate de que el archivo .env exista y la variable esté configurada.');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Conectado...');
        // Comenta la siguiente línea para desactivar los logs de depuración de Mongoose,
        // incluyendo los mensajes de creación de índices.
        // mongoose.set('debug', true); 

    } catch (err) {
        console.error('Error al conectar a MongoDB:', err.message);
        process.exit(1);
    }
};
connectDB(); // Llama a la función para conectar a la DB

// =======================================================
// IMPORTACIÓN Y DEFINICIÓN DE RUTAS API
// Las rutas de backend están en la carpeta 'backend/routes'
// Si app.js está en 'backend/', las rutas relativas a 'routes' son directas
// =====================================================================
const productRoutes = require('./routes/productRoutes'); 
const authRoutes = require('./routes/authRoutes');     
const userRoutes = require('./routes/userRoutes');     
const cartRoutes = require('./routes/cartRoutes');     
const orderRoutes = require('./routes/orderRoutes');   
const adminRoutes = require('./routes/adminRoutes'); 
const categoryRoutes = require('./routes/categoryRoutes'); // ¡NUEVO: Importa las rutas de categorías!

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/categories', categoryRoutes); // ¡NUEVO: Usa las rutas de categorías aquí!


// =======================================================
// RUTA PRINCIPAL PARA SERVIR index.html (PARA APLICACIONES SPA)
// =======================================================
const indexPath = path.resolve(publicPath, 'index.html');
app.get('/', (req, res) => {
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error al enviar index.html:', err.message);
            res.status(500).send('Error al cargar la página principal.');
        }
    });
});

// =======================================================
// MANEJADORES DE ERRORES (COLOCAR AL FINAL)
// =======================================================

// Middleware para manejar rutas no encontradas (404) - ¡AHORA ENVÍA JSON!
app.use((req, res, next) => {
    const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
    error.status = 404; 
    next(error); 
});

// Middleware de manejo de errores global - ¡AHORA SIEMPRE ENVÍA JSON!
app.use((err, req, res, next) => {
    console.error(err.stack); 
    res.status(err.status || 500).json({ 
        message: err.message || 'Error interno del servidor',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

// =======================================================
// INICIO DEL SERVIDOR
// =======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));


module.exports = app;
