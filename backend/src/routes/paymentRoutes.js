// src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware de autenticación (el mismo que ya usamos antes)
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

// 1. Ruta Protegida: El usuario pide pagar un producto
router.post('/checkout', verificarToken, paymentController.generarOrdenPago);

// 2. Ruta Pública: El Webhook donde la pasarela nos avisa del éxito
router.post('/webhook', paymentController.recibirWebhookPago);

module.exports = router;