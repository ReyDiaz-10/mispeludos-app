// src/routes/petRoutes.js
const express = require('express');
const router = express.Router();

// Importamos el controlador de mascotas
const petController = require('../controllers/petController');

// Importamos a nuestro "Guardia de Seguridad" (Middleware)
const { verificarTokenYDispositivo } = require('../middlewares/authMiddleware');

// === RUTAS PROTEGIDAS ===
// Al poner "verificarTokenYDispositivo" antes de la función del controlador,
// obligamos a que la petición pase primero por el guardia.

// Ruta para que el usuario registre una mascota (POST)
router.post('/', verificarTokenYDispositivo, petController.registerPet);

// Ruta para que el usuario vea sus mascotas (GET)
router.get('/', verificarTokenYDispositivo, petController.getMyPets);

module.exports = router;