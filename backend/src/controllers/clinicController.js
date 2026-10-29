// src/controllers/clinicController.js
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registrar una nueva Clínica
const registerClinic = async (req, res) => {
    try {
        const { nombre_clinica, email, password, telefono, direccion, horarios_atencion } = req.body;

        if (!nombre_clinica || !email || !password || !telefono || !direccion || !horarios_atencion) {
            return res.status(400).json({ error: 'Todos los campos básicos son obligatorios para la clínica.' });
        }

        // Verificar si el correo ya existe
        const clinicExists = await db.query('SELECT * FROM clinicas WHERE email = $1', [email]);
        if (clinicExists.rows.length > 0) {
            return res.status(409).json({ error: 'Este correo ya está registrado por otra clínica.' });
        }

        // Encriptar contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Guardar en la base de datos
        const result = await db.query(
            `INSERT INTO clinicas (nombre_clinica, email, password_hash, telefono, direccion, horarios_atencion) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre_clinica, email`,
            [nombre_clinica, email, hashedPassword, telefono, direccion, horarios_atencion]
        );

        res.status(201).json({
            status: 'success',
            message: 'Clínica registrada correctamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al registrar clínica:', error);
        res.status(500).json({ error: 'Hubo un error al registrar la clínica.' });
    }
};

// Iniciar sesión (Login) para Clínicas
const loginClinic = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
        }

        const clinicQuery = await db.query('SELECT * FROM clinicas WHERE email = $1', [email]);
        if (clinicQuery.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }

        const clinic = clinicQuery.rows[0];
        const isPasswordValid = await bcrypt.compare(password, clinic.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }

        // Crear token con un "rol" especial para saber que es clínica
        const token = jwt.sign(
            { id: clinic.id, email: clinic.email, role: 'CLINICA' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '30d' }
        );

        res.status(200).json({
            status: 'success',
            message: 'Inicio de sesión de clínica exitoso',
            token: token,
            data: {
                id: clinic.id,
                nombre_clinica: clinic.nombre_clinica,
                email: clinic.email
            }
        });
    } catch (error) {
        console.error('Error en el login de clínica:', error);
        res.status(500).json({ error: 'Hubo un error en el inicio de sesión.' });
    }
};

module.exports = {
    registerClinic,
    loginClinic
};