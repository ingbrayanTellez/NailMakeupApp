const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// Configura Express para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

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

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

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