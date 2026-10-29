// Import library for PostgreSQL
const { Pool } = require('pg');
require('dotenv').config();

// Create database connection pool (Crear la conexión)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test the connection (Probar que se conectó correctamente)
pool.connect((error, client, release) => {
    if (error) {
        console.error('Error connecting to the database:', error.message);
    } else {
        console.log('Successfully connected to the PostgreSQL database!');
        release(); // Release client (Liberar el cliente)
    }
});

// Export connection to use in other files (Exportar para usar en el proyecto)
module.exports = pool;