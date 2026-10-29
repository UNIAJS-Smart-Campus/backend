// ============================================================
// CORREO SALIENTE (recuperación de contraseña)
//
// El envío es opcional: si no hay credenciales SMTP configuradas el
// transporte no se crea y `correoConfigurado()` devuelve false, para que el
// controlador responda con un error honesto en vez de fingir que envió algo.
//
// Variables (en el .env raíz, que auth-service carga por env_file):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, FRONT_URL
// ============================================================

const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

// Sin host y usuario no hay a dónde conectarse.
const configurado = Boolean(SMTP_HOST && SMTP_USER);

// El puerto 465 es SMTPS (TLS implícito); el resto usa STARTTLS.
const transporter = configurado
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    })
    : null;

function correoConfigurado() {
    return configurado;
}

/**
 * Envía el enlace de restablecimiento.
 * @param {string} destino correo del usuario
 * @param {string} enlace  URL completa con el token
 */
async function enviarRecuperacion(destino, enlace) {
    if (!transporter) {
        throw new Error('SMTP no configurado');
    }
    await transporter.sendMail({
        from: SMTP_FROM,
        to: destino,
        subject: 'Restablece tu contraseña — Smart Campus UNIAJS',
        text:
            'Recibimos una solicitud para restablecer tu contraseña.\n\n' +
            `Abre este enlace para crear una nueva (válido 1 hora):\n${enlace}\n\n` +
            'Si no lo solicitaste, ignora este mensaje: tu contraseña no cambia.',
        html:
            '<p>Recibimos una solicitud para restablecer tu contraseña.</p>' +
            `<p><a href="${enlace}">Crear una nueva contraseña</a> (válido 1 hora).</p>` +
            '<p>Si no lo solicitaste, ignora este mensaje: tu contraseña no cambia.</p>'
    });
}

module.exports = { correoConfigurado, enviarRecuperacion };
