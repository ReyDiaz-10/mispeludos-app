// Import libraries
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database connection (Importar conexión a la base de datos)
const db = require('./config/database');

// Import routes (Importar archivos de rutas)
const authRoutes = require('./routes/authRoutes');
const petRoutes = require('./routes/petRoutes');
const clinicRoutes = require('./routes/clinicRoutes');
const productRoutes = require('./routes/productRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Create Express app
const app = express();

// Middlewares
app.use(cors()); 
app.use(express.json());

// Main API Routes (Conectar las rutas principales)
// Toda ruta que empiece con /api/auth será manejada por authRoutes.js
app.use('/api/clinics', clinicRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);


// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Servidor MisPeludos funcionando correctamente' 
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor de MisPeludos ejecutándose en http://localhost:${PORT}`);
});