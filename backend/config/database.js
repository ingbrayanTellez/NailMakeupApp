const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // mongoose.connect devuelve una promesa que resuelve en un objeto de conexión
        const conn = await mongoose.connect(process.env.DB_URI, {
            useNewUrlParser: true,       
            useUnifiedTopology: true,    
        });
        console.log(`MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error de conexión a MongoDB: ${error.message}`);
        // Si hay un error crítico al conectar a la DB, cerramos la aplicación
        process.exit(1);
    }
};

module.exports = connectDB; // Exportamos la función para poder llamarla desde app.js