const path = require('path');
const mysql = require('mysql2/promise');

// Las credenciales de la base viven en backend/.env (desarrollo) y en las
// variables de entorno de Render (producción). dotenv no pisa valores ya
// definidos.
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

let mysqlDisponible = true;
try {
    require('mysql2/promise');
} catch {
    mysqlDisponible = false;
}

// Pool propio y mínimo: la comprobación de revocación se hace en cada
// petición autenticada, así que el pool debe ser pequeño y no competir con
// los servicios.
let pool = null;
function obtenerPool() {
    if (pool) return pool;
    if (!mysqlDisponible || !process.env.DB_HOST) return null;
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: Number(process.env.SESSIONES_DB_CONN_LIMIT) || 2,
        connectTimeout: 8000,
        ...(process.env.DB_SSL === '1'
            ? { ssl: { rejectUnauthorized: process.env.DB_SSL_VERIFY !== '0' } }
            : {})
    });
    return pool;
}

// Caché en memoria: sid -> { revocada, expiraMs }.
// TTL corto (30 s): un logout se propaga en como máximo ese margen, y no
// golpeamos la base de datos en cada petición.
const TTL_CACHE_MS = Number(process.env.SESSIONES_CACHE_TTL_MS) || 30000;
const cache = new Map();

function ahora() {
    return Date.now();
}

/**
 * Indica si una sesión (identificada por el `sid` del access JWT) está
 * revocada o expirada.
 *
 * Falla abierto (false): si la base no está disponible, no se deja fuera a
 * todos los usuarios; solo se advierte por consola. La base es crítica para
 * la aplicación de todos modos.
 */
async function estaRevocada(sid) {
    if (!sid) return false;

    const t = ahora();
    const entrada = cache.get(sid);
    if (entrada && entrada.expiraMs > t) return entrada.revocada;

    const conexion = obtenerPool();
    if (!conexion) {
        console.warn('[sesiones] base no configurada: se omite la comprobación de revocación');
        return false;
    }

    try {
        const [filas] = await conexion.query(
            'SELECT revocada, expires_at FROM sesiones WHERE sid = ? LIMIT 1',
            [sid]
        );

        if (!filas.length) {
            // sid desconocido: tratar como revocado para no aceptar sesiones
            // huérfanas.
            cache.set(sid, { revocada: true, expiraMs: t + TTL_CACHE_MS });
            return true;
        }

        const fila = filas[0];
        const revocada = fila.revocada === 1 || fila.revocada === true;
        const expirada = new Date(fila.expires_at) <= new Date();
        const resultado = revocada || expirada;

        cache.set(sid, { revocada: resultado, expiraMs: t + TTL_CACHE_MS });
        return resultado;
    } catch (error) {
        console.warn('[sesiones] no se pudo consultar la revocación:', error.message);
        return false;
    }
}

/**
 * Middleware del gateway: rechaza (401) las peticiones cuyo access JWT
 * pertenezca a una sesión revocada o expirada. Se monta tras verificar el
 * JWT (necesita `req.user.sid`) y antes de autorizar por rol.
 */
function sesionMiddleware(req, res, next) {
    const sid = req.user && req.user.sid;
    estaRevocada(sid)
        .then((revocada) => {
            if (revocada) {
                return res.status(401).json({ error: 'Sesión revocada o expirada. Inicia sesión de nuevo.' });
            }
            next();
        })
        .catch(next);
}

module.exports = { sesionMiddleware, estaRevocada };
