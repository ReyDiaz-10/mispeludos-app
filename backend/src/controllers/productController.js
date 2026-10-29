// src/controllers/productController.js
const db = require('../config/database');

// 1. La clínica registra un producto
const registerProduct = async (req, res) => {
    try {
        const { nombre, descripcion, precio_base } = req.body;
        const clinica_id = req.usuario.id;

        if (req.usuario.role !== 'CLINICA') {
            return res.status(403).json({ error: 'Solo las clínicas veterinarias pueden subir productos.' });
        }

        if (!nombre || !precio_base) {
            return res.status(400).json({ error: 'El nombre y el precio base son obligatorios.' });
        }

        // Insertar producto. El precio_publico (precio_base + 20%) lo calcula PostgreSQL automáticamente
        const result = await db.query(
            `INSERT INTO productos_clinica (clinica_id, nombre, descripcion, precio_base) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, nombre, precio_base, precio_publico`,
            [clinica_id, nombre, descripcion, precio_base]
        );

        res.status(201).json({
            status: 'success',
            message: 'Producto registrado. Se aplicará un aumento del 20% al público general.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error al registrar producto:', error);
        res.status(500).json({ error: 'Hubo un error al registrar el producto.' });
    }
};

// 2. Ver catálogo de una clínica calculando el precio según el usuario (Suscrito o No Suscrito)
const getClinicProductsForUser = async (req, res) => {
    try {
        const { clinicId } = req.params;
        const userId = req.usuario.id; // Obtenemos el ID del dueño que está mirando la app

        // Verificar si el usuario tiene suscripción activa
        const userQuery = await db.query('SELECT suscripcion_activa FROM usuarios WHERE id = $1', [userId]);
        const isSubscribed = userQuery.rows.length > 0 ? userQuery.rows[0].suscripcion_activa : false;

        // Consultar los productos de la clínica
        const productsQuery = await db.query(
            'SELECT id, nombre, descripcion, precio_base, precio_publico FROM productos_clinica WHERE clinica_id = $1 AND activo = true',
            [clinicId]
        );

        // Ajustar el precio de manera inteligente según tu regla de negocio
        const productosProcesados = productsQuery.rows.map(prod => {
            const precioBase = parseFloat(prod.precio_base);
            const precioPublico = parseFloat(prod.precio_publico);

            if (isSubscribed) {
                // Usuario SUSCRITO: Tiene 15% de descuento sobre el precio público
                const descuento = precioPublico * 0.15;
                const precioFinal = precioPublico - descuento;
                return {
                    id: prod.id,
                    nombre: prod.nombre,
                    descripcion: prod.descripcion,
                    precioMostrar: precioFinal.toFixed(2),
                    tipoPrecio: 'Precio con 15% de descuento por suscripción',
                    comisionApp: (precioPublico * 0.05).toFixed(2) // 5% para ti
                };
            } else {
                // Usuario NO SUSCRITO: Paga el precio público completo ($ precio con 20% aplicado)
                return {
                    id: prod.id,
                    nombre: prod.nombre,
                    descripcion: prod.descripcion,
                    precioMostrar: precioPublico.toFixed(2),
                    tipoPrecio: 'Precio estándar (con 20% de incremento)',
                    comisionApp: (precioBase * 0.10).toFixed(2) // Tu 10% del incremento se va a tu llave
                };
            }
        });

        res.status(200).json({
            status: 'success',
            usuarioSuscrito: isSubscribed,
            data: productosProcesados
        });

    } catch (error) {
        console.error('Error al cargar productos:', error);
        res.status(500).json({ error: 'Hubo un error al cargar el catálogo.' });
    }
};

module.exports = {
    registerProduct,
    getClinicProductsForUser
};