// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();



// Import the authentication controller (Importar el controlador de autenticación)
const authController = require('../controllers/authController');

// Define the registration route (Definir la ruta de registro POST)
// Cuando llamen a /register, se ejecutará la función registerUser
router.post('/register', authController.registerUser);

// Define the login route (Definir la ruta de inicio de sesión)
router.post('/login', authController.loginUser);

// Export the router (Exportar las rutas)
module.exports = router;