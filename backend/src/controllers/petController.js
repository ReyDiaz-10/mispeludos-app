// src/controllers/petController.js
const db = require('../config/database');

// Registrar una nueva mascota
const registerPet = async (req, res) => {
    try {
        // Extraemos los datos de la mascota del cuerpo de la petición
        const { nombre, especie, raza, edad, color, enfermedades_previas } = req.body;
        
        // Extraemos el ID del dueño (req.usuario lo pone el middleware authMiddleware)
        const propietario_id = req.usuario.id;

        // Validar datos básicos obligatorios
        if (!nombre || !especie) {
            return res.status(400).json({ error: 'El nombre y la especie son obligatorios.' });
        }

        // Insertar la mascota en la base de datos
        // NOTA: Si el usuario ya tiene 2 mascotas, PostgreSQL lanzará un error automáticamente
        // gracias al "TRIGGER" que configuramos en la base de datos (Paso 6).
        const result = await db.query(
            `INSERT INTO mascotas (propietario_id, nombre, especie, raza, edad, color, enfermedades_previas) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id, nombre, especie, raza`,
            [propietario_id, nombre, especie, raza, edad, color, enfermedades_previas]
        );

        res.status(201).json({
            status: 'success',
            message: 'Mascota registrada correctamente',
            data: result.rows[0]
        });

    } catch (error) {
        // Si PostgreSQL detecta que ya tiene 2 mascotas, arroja un error que capturamos aquí
        if (error.message.includes('Un suscriptor solo puede registrar un máximo de 2 mascotas')) {
            return res.status(403).json({ error: 'Has alcanzado el límite de 2 mascotas por cuenta.' });
        }
        
        console.error('Error al registrar mascota:', error);
        res.status(500).json({ error: 'Hubo un error al registrar la mascota.' });
    }
};

// Obtener las mascotas del usuario
const getMyPets = async (req, res) => {
    try {
        const propietario_id = req.usuario.id;

        const result = await db.query(
            'SELECT * FROM mascotas WHERE propietario_id = $1 ORDER BY creado_en DESC',
            [propietario_id]
        );

        res.status(200).json({
            status: 'success',
            data: result.rows
        });
    } catch (error) {
        console.error('Error al obtener mascotas:', error);
        res.status(500).json({ error: 'Hubo un error al cargar tus mascotas.' });
    }
};

module.exports = {
    registerPet,
    getMyPets
};