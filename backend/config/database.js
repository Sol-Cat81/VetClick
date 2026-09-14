// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // Carga los datos de tu archivo .env

// Creamos el Pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Máximo de conexiones simultáneas
    queueLimit: 0
});

// Mensaje opcional para comprobar que conecta al iniciar
pool.getConnection()
    .then(connection => {
        console.log('¡Base de datos de la Veterinaria conectada con éxito!');
        connection.release(); // Soltamos la conexión para que otros la usen
    })
    .catch(err => {
        console.error('Error al conectar con la base de datos:', err.message);
    });

// Exportamos el pool para poder usarlo en otras partes del proyecto
module.exports = pool;