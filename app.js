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

// Sirve archivos estáticos desde la carpeta 'public' (FRONTEND)
// Es importante que esta ruta estática apunte correctamente
// Si `app.js` está en `backend/`, entonces `../public` es correcto para la raíz del frontend.
const publicPath = path.join(__dirname, 'public');
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
        // AÑADE ESTA LÍNEA AQUÍ, DENTRO DEL BLOQUE try DE connectDB:
        mongoose.set('debug', true); // Esto activará el modo debug de Mongoose

    } catch (err) {
        console.error('Error al conectar a MongoDB:', err.message);
        process.exit(1);
    }
};
connectDB(); // Llama a la función para conectar a la DB

// =======================================================
// IMPORTACIÓN DE RUTAS (DEBEN IR DESPUÉS DEL MIDDLEWARE GLOBAL)
// =======================================================
// Las rutas deben ser relativas a la ubicación de app.js, que está en la raíz
// Por ejemplo, './backend/routes/productRoutes' si app.js está en la raíz y backend/routes es la carpeta
// En este caso, según tu dir anterior, app.js está en la raíz, entonces las rutas son:
const productRoutes = require('./backend/routes/productRoutes');
const authRoutes = require('./backend/routes/authRoutes');
const userRoutes = require('./backend/routes/userRoutes');
const cartRoutes = require('./backend/routes/cartRoutes'); // Nueva ruta de carrito

// =======================================================
// DEFINICIÓN DE RUTAS API
// =======================================================
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes); // <--- TU RUTA DE CARRITO AÑADIDA AQUÍ

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

// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
    res.status(404).send('Lo siento, no se pudo encontrar esa página.');
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
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
