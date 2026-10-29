// src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware de autenticación general para verificar el token del usuario o clínica
const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

// Ruta para que la clínica registre un producto (POST /api/products)
router.post('/', verificarToken, productController.registerProduct);

// Ruta para que los dueños vean el catálogo con precios inteligentes (GET /api/products/clinic/:clinicId)
router.get('/clinic/:clinicId', verificarToken, productController.getClinicProductsForUser);

module.exports = router;