// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

// Middleware de verificación de seguridad
const verificarTokenYDispositivo = async (req, res, next) => {
    try {
        // 1. Extraemos el token que el usuario debe enviar en la cabecera (Header) de la petición
        const authHeader = req.headers.authorization;
        // 2. Extraemos el ID del celular que la app móvil (Flutter) enviará
        const dispositivoIdCliente = req.headers['x-device-id']; 

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token válido.' });
        }

        if (!dispositivoIdCliente) {
            return res.status(400).json({ error: 'Es obligatorio enviar el ID del dispositivo celular.' });
        }

        // El token viene así: "Bearer eyJhbGci...", lo separamos para quedarnos solo con el código
        const token = authHeader.split(' ')[1];

        // 3. Verificamos que el token sea auténtico (usando nuestro secreto)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Buscamos qué celular tiene registrado este usuario en la base de datos
        const userQuery = await db.query('SELECT dispositivo_id_actual FROM usuarios WHERE id = $1', [decoded.id]);
        
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado en el sistema.' });
        }

        const dispositivoRegistrado = userQuery.rows[0].dispositivo_id_actual;

        // 5. VALIDACIÓN CLAVE: Si el celular que usa ahora no es el celular que registró antes
        if (dispositivoRegistrado && dispositivoRegistrado !== dispositivoIdCliente) {
            // Este código 409 le dirá a la App Móvil que debe mostrar la alerta:
            // "¿Desea transferir los datos a este nuevo teléfono?"
            return res.status(409).json({
                requiereTransferencia: true,
                mensaje: 'Esta cuenta está abierta en otro celular. ¿Desea transferir los datos a este nuevo teléfono?'
            });
        }

        // Si todo está bien (token válido y mismo celular), lo dejamos pasar a la siguiente función
        req.usuario = decoded; // Guardamos los datos del usuario en la petición para usarlos luego
        next();
        
    } catch (error) {
        return res.status(401).json({ error: 'Sesión inválida o expirada. Por favor, inicia sesión nuevamente.' });
    }
};

module.exports = {
    verificarTokenYDispositivo
};