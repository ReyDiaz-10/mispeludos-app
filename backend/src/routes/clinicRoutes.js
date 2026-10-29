// src/routes/clinicRoutes.js
const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinicController');

// Rutas de autenticación para clínicas
router.post('/register', clinicController.registerClinic);
router.post('/login', clinicController.loginClinic);

module.exports = router;