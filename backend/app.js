const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const productRoutes = require('./routes/productRoutes'); // Aquí es donde busca
const authRoutes = require('./routes/authRoutes');     // Aquí es donde busca
const userRoutes = require('./routes/userRoutes');     // <-- ¡NUEVA IMPORTACIÓN!
const path = require('path'); 
const fs = require('fs');

dotenv.config();

const app = express();

// =====================================================================
// Conexión a MongoDB
// =====================================================================
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

// =====================================================================
// Middlewares Globales
// =====================================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================================
// Configuración de Archivos Estáticos y Ruta Raíz (Frontend)
// =====================================================================

// Sirve toda la carpeta 'public' como archivos estáticos.
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));
console.log(`[DEBUG] Sirviendo archivos estáticos desde: ${publicPath}`);

// Asegurarse de que la carpeta 'uploads' dentro de 'public' exista al iniciar la aplicación.
const uploadsDir = path.join(publicPath, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`[DEBUG] Creada carpeta de uploads en: ${uploadsDir}`);
} else {
    console.log(`[DEBUG] Carpeta de uploads ya existe en: ${uploadsDir}`);
}

// Ruta para la página principal (index.html)
const indexPath = path.resolve(publicPath, 'index.html');
console.log(`[DEBUG] Ruta ABSOLUTA configurada para index.html: ${indexPath}`);

app.get('/', (req, res) => {
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error al enviar index.html:', err.message);
            res.status(500).send('Error al cargar la página principal.');
        } else {
            console.log('index.html enviado con éxito.');
        }
    });
});

// =====================================================================
// Rutas de la API
// =====================================================================
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // <-- ¡NUEVA LÍNEA AÑADIDA!

// =====================================================================
// Manejo de Errores
// =====================================================================
app.use((req, res, next) => {
    console.warn(`404 Not Found: ${req.originalUrl}`);
    res.status(404).send('Lo siento, no se pudo encontrar esa página.');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        message: err.message || 'Error interno del servidor',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

// =====================================================================
// Iniciar el Servidor
// =====================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));

module.exports = app;