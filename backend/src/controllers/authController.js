// src/controllers/authController.js
const db = require('../config/database');
const bcrypt = require('bcrypt'); // Importamos la librería para encriptar
const jwt = require('jsonwebtoken'); // Importar JWT para crear tokens

// Register user function (Registrar nuevo dueño de mascota)
const registerUser = async (req, res) => {
    try {
        // Extraemos los datos que nos envía la app móvil (Frontend)
        const { fullName, email, password, phone } = req.body;

        // 1. Validar que vengan todos los datos obligatorios
        if (!fullName || !email || !password) {
            return res.status(400).json({ error: 'Por favor completa todos los campos obligatorios.' });
        }

        // 2. Verificar si el usuario ya existe en la base de datos
        const userExists = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (userExists.rows.length > 0) {
            return res.status(409).json({ error: 'Este correo electrónico ya está registrado.' });
        }

        // 3. Encriptar la contraseña (salt rounds = 10)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 4. Insertar el nuevo usuario en PostgreSQL
        const result = await db.query(
            `INSERT INTO usuarios (nombre_completo, email, password_hash, telefono) 
             VALUES ($1, $2, $3, $4) RETURNING id, nombre_completo, email, telefono`,
            [fullName, email, hashedPassword, phone]
        );

        const nuevoUsuario = result.rows[0];

        // 5. Responder a la app móvil con éxito
        res.status(201).json({
            status: 'success',
            message: 'Dueño registrado correctamente en la base de datos',
            data: nuevoUsuario
        });

    } catch (error) {
        console.error('Error al registrar:', error);
        res.status(500).json({ error: 'Hubo un error en el servidor al registrar el usuario.' });
    }
};
// Login user function (Iniciar sesión de dueño)
const loginUser = async (req, res) => {
    try {
        const { email, password, deviceId } = req.body;

        if (!email || !password || !deviceId) {
            return res.status(400).json({ error: 'Email, contraseña e ID del dispositivo son obligatorios.' });
        }

        // 1. Buscar al usuario en la BD
        const userQuery = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (userQuery.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas (Usuario no encontrado).' });
        }

        const user = userQuery.rows[0];

        // 2. Verificar la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciales incorrectas (Contraseña inválida).' });
        }

        // 3. Crear el Token JWT (El gafete de acceso)
        // Usamos una palabra secreta (la pondremos en el .env enseguida)
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '30d' } // El token dura 30 días
        );

        // 4. Actualizar el dispositivo actual en la BD (Control de 1 solo celular)
        await db.query(
            'UPDATE usuarios SET dispositivo_id_actual = $1 WHERE id = $2',
            [deviceId, user.id]
        );

        // 5. Enviar éxito y el token
        res.status(200).json({
            status: 'success',
            message: 'Inicio de sesión exitoso',
            token: token,
            data: {
                id: user.id,
                fullName: user.nombre_completo,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ error: 'Hubo un error en el servidor durante el inicio de sesión.' });
    }
};

// Exportar ambas funciones
module.exports = {
    registerUser,
    loginUser
};