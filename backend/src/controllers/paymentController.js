// src/controllers/paymentController.js
const db = require('../config/database');

// 1. Generar la orden de compra y el enlace de pago
const generarOrdenPago = async (req, res) => {
    try {
        const { producto_id } = req.body;
        const usuario_id = req.usuario.id;

        // Verificar si el usuario está suscrito
        const userQuery = await db.query('SELECT suscripcion_activa FROM usuarios WHERE id = $1', [usuario_id]);
        const isSubscribed = userQuery.rows[0].suscripcion_activa;

        // Obtener datos del producto
        const productQuery = await db.query('SELECT * FROM productos_clinica WHERE id = $1', [producto_id]);
        if (productQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        
        const producto = productQuery.rows[0];
        const precioBase = parseFloat(producto.precio_base);
        const precioPublico = parseFloat(producto.precio_publico);

        // Calcular el dinero exacto para el Split Payment
        let totalACobrar, comisionTuLlave, montoClinica;

        if (isSubscribed) {
            totalACobrar = precioPublico * 0.85; // 15% de descuento
            comisionTuLlave = precioPublico * 0.05; // Tu 5%
            montoClinica = totalACobrar - comisionTuLlave;
        } else {
            totalACobrar = precioPublico; // Precio full con 20%
            comisionTuLlave = precioBase * 0.10; // Tu 10%
            montoClinica = totalACobrar - comisionTuLlave;
        }

        // Aquí es donde en el futuro enviaremos la petición real a Wompi/MercadoPago.
        // Por ahora, generamos una respuesta simulada con los datos exactos que exige la pasarela.
        const simulacionPasarela = {
            url_pago_pse: `https://pago.mispeludos.com/checkout/${Math.floor(Math.random() * 1000000)}`,
            detalle_split_payment: {
                total_cobrado_cliente: totalACobrar.toFixed(2),
                transferencia_tu_llave: comisionTuLlave.toFixed(2),
                transferencia_clinica: montoClinica.toFixed(2)
            }
        };

        res.status(200).json({
            status: 'success',
            message: 'Orden de pago generada correctamente. Redirigiendo a pasarela...',
            data: simulacionPasarela
        });

    } catch (error) {
        console.error('Error al generar pago:', error);
        res.status(500).json({ error: 'Hubo un error al procesar la orden de pago.' });
    }
};

// 2. Webhook: El endpoint secreto donde la pasarela nos avisa que el pago fue exitoso
const recibirWebhookPago = async (req, res) => {
    // La pasarela de pagos envía datos a esta ruta cuando el cliente termina de pagar
    const { id_transaccion, estado, producto_id, usuario_id } = req.body;

    if (estado === 'APROBADO') {
        console.log(`✅ ¡PAGO EXITOSO! Transacción ${id_transaccion}. El dinero ha sido dividido.`);
        // Aquí iría el código SQL para guardar la compra en el historial del usuario
    } else {
        console.log(`❌ Pago fallido o rechazado. Transacción: ${id_transaccion}`);
    }

    // Siempre debemos responder 200 OK a la pasarela para que sepa que recibimos el mensaje
    res.status(200).send('Webhook recibido');
};

module.exports = {
    generarOrdenPago,
    recibirWebhookPago
};