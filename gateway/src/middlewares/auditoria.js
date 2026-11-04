const path = require('path');

// Las credenciales de la base viven en backend/.env (desarrollo) y en las
// variables de entorno de Render (producción). dotenv no pisa valores ya
// definidos, así que en producción no cambia nada.
// Ruta: backend/gateway/src/middlewares -> ../../../.env = backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

// mysql2 es una dependencia del gateway. Si por lo que sea no estuviera
// instalada, la auditoría se desactiva en lugar de tumbar el API entero
// (este middleware vive en la cadena crítica de todas las peticiones).
let mysql = null;
try {
    mysql = require('mysql2/promise');
} catch (error) {
    console.warn(`[auditoria] mysql2 no disponible, auditoría desactivada: ${error.message}`);
}

// Roles que se auditan. Por defecto solo Administrador (id_rol = 1); se puede
// ampliar con AUDITORIA_ROLES=1,4 sin tocar código.
const ROLES_AUDITADOS = String(process.env.AUDITORIA_ROLES || '1')
    .split(',')
    .map((rol) => Number(rol.trim()))
    .filter(Number.isFinite);

// Método HTTP -> etiqueta que se guarda en `auditoria.accion`.
const ACCION_POR_METODO = {
    POST: 'CREAR',
    PUT: 'ACTUALIZAR',
    PATCH: 'ACTUALIZAR',
    DELETE: 'ELIMINAR'
};

// Prefijo de la ruta -> tabla que administra ese microservicio. La fila
// guarda además la ruta exacta en el detalle para no perder sub-recursos
// (p. ej. /api/requests/12/avance).
const ENTIDADES = [
    ['/api/users', 'usuarios'],
    ['/api/events', 'eventos_y_actividades'],
    ['/api/reservations', 'reservas'],
    ['/api/requests', 'solicitudes'],
    ['/api/resources', 'recursos'],
    ['/api/feedback', 'pqrs'],
    ['/api/academic-info', 'info_academica'],
    ['/api/configuration', 'configuracion'],
    ['/api/notifications', 'notificaciones'],
    ['/api/auth', 'sesion']
];

// Campos que jamás deben quedar en texto plano dentro del detalle.
const CLAVE_SENSIBLE = /(pass|contrase|token|secret|jwt|autoriz)/i;

// `auditoria.detalle` es varchar(500): nunca se supera.
const LIMITE_DETALLE = 490;

// Máximo de la respuesta del microservicio que se copia al detalle (64 KB).
const LIMITE_RESPUESTA = 64 * 1024;

// Pool propio y mínimo: la auditoría escribe poco (solo mutaciones de
// administrador) y nunca debe competir por conexiones con los servicios.
let pool = null;

function obtenerPool() {
    if (pool) return pool;
    if (!mysql || !process.env.DB_HOST) return null;
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: Number(process.env.AUDITORIA_DB_CONN_LIMIT) || 2,
        connectTimeout: 8000,
        // Mismo esquema TLS que los servicios (TiDB Serverless lo exige).
        ...(process.env.DB_SSL === '1'
            ? { ssl: { rejectUnauthorized: process.env.DB_SSL_VERIFY !== '0' } }
            : {})
    });
    return pool;
}

/** id numérico tomado de la ruta: /api/users/123 -> "123". */
function idDesdeRuta(ruta, prefijo) {
    const [primero] = ruta.slice(prefijo.length).split('/').filter(Boolean);
    return primero && /^\d+$/.test(primero) ? primero : '';
}

/** id de la fila creada, leído de la respuesta del microservicio. */
function idDesdeRespuesta(cuerpo) {
    if (!cuerpo || typeof cuerpo !== 'object') return '';
    const datos = cuerpo.data;
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return '';
    const clave = Object.keys(datos).find((clave) => /^id_/.test(clave));
    if (!clave) return '';
    const valor = String(datos[clave]);
    return /^\d+$/.test(valor) ? valor : '';
}

/** IP real del cliente (X-Forwarded-For, que el proxy delante pone). */
function ipDe(req) {
    const xff = req.headers['x-forwarded-for'];
    if (xff) return String(xff).split(',')[0].trim();
    return req.ip || '';
}

/**
 * Copia resumida del cuerpo de la respuesta para el detalle: se descartan
 * campos sensibles (contraseñas, tokens), se acotan los valores largos
 * (p. ej. la foto en base64) y se limita a 8 campos.
 */
function datosSanos(cuerpo) {
    if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) return undefined;
    // Las respuestas envuelven el registro en `data`: se mira dentro.
    const fuente =
        cuerpo.data && typeof cuerpo.data === 'object' && !Array.isArray(cuerpo.data)
            ? cuerpo.data
            : cuerpo;

    const salida = {};
    const claves = Object.keys(fuente)
        .filter((clave) => !CLAVE_SENSIBLE.test(clave))
        .slice(0, 8);

    for (const clave of claves) {
        const valor = fuente[clave];
        salida[clave] =
            valor !== null && typeof valor === 'object'
                ? Array.isArray(valor)
                    ? '[lista]'
                    : '[objeto]'
                : String(valor).slice(0, 60);
    }
    return Object.keys(salida).length ? salida : undefined;
}

/** Construye el JSON del detalle sin pasar de 500 caracteres. */
function detalleAuditoria({ metodo, ruta, estado, ip, datos }) {
    const base = { metodo, ruta, estado, ip };
    if (datos) base.datos = datos;

    let texto = JSON.stringify(base);
    if (texto.length <= LIMITE_DETALLE) return texto;

    // Muy largo (respuesta con muchos campos): se suelta el cuerpo.
    delete base.datos;
    texto = JSON.stringify(base);
    if (texto.length <= LIMITE_DETALLE) return texto;

    // Ruta excesiva: se acorta y se marca.
    base.ruta = ruta.slice(0, 80);
    base.rutaAcortada = true;
    texto = JSON.stringify(base);
    if (texto.length <= LIMITE_DETALLE) return texto;

    return JSON.stringify({ metodo, ruta: ruta.slice(0, 40), estado, ip, truncado: true });
}

/**
 * Inserta la fila en `auditoria`. Es una tarea de fondo: nunca rechaza la
 * petición original, solo avisa por consola si falla.
 */
async function guardarAuditoria(fila) {
    try {
        const conexion = obtenerPool();
        if (!conexion) return;
        await conexion.query(
            `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, detalle)
             VALUES (?, ?, ?, ?, ?)`,
            [fila.idUsuario, fila.accion, fila.entidad, fila.idEntidad, fila.detalle]
        );
    } catch (error) {
        console.warn(`[auditoria] no se pudo registrar ${fila.accion} sobre ${fila.entidad}: ${error.message}`);
    }
}

/**
 * Interpreta `auditoria.detalle`: todas las filas nuevas guardan JSON, pero
 * se tolera texto plano de registros antiguos (se devuelve tal cual).
 */
function parsearDetalle(texto) {
    if (typeof texto !== 'string') return texto ?? null;
    try {
        return JSON.parse(texto);
    } catch {
        return texto;
    }
}

/**
 * Lectura para el panel "Actividad reciente" (GET /api/audit): últimas filas
 * de `auditoria` de más reciente a más antigua, con el nombre del actor
 * (join con `usuarios`) y el detalle ya parseado.
 *
 * `limite` se recorta a 1..200 (50 por defecto): es una lectura para una
 * vista, no un export, así que no tiene sentido pedir miles de filas.
 */
async function consultarActividad(limite) {
    const conexion = obtenerPool();
    if (!conexion) {
        throw new Error('auditoría no configurada (faltan variables DB_*)');
    }

    const tope = Math.min(Math.max(Number.parseInt(limite, 10) || 50, 1), 200);
    const [filas] = await conexion.query(
        `SELECT a.id_auditoria AS id,
                a.id_usuario,
                u.usuario,
                TRIM(CONCAT(IFNULL(u.nombre, ''), ' ', IFNULL(u.apellido, ''))) AS nombre,
                a.accion,
                a.entidad,
                a.id_entidad,
                a.detalle,
                a.fecha
           FROM auditoria a
           LEFT JOIN usuarios u ON u.id_usuario = a.id_usuario
          ORDER BY a.id_auditoria DESC
          LIMIT ${tope}`
    );

    return filas.map((fila) => ({
        ...fila,
        detalle: parsearDetalle(fila.detalle)
    }));
}

/**
 * Middleware: registra en la tabla `auditoria` toda escritura (POST, PUT,
 * PATCH, DELETE) que realiza un usuario administrador a través del API.
 *
 * Va montado DESPUÉS de verificar el JWT (necesita saber quién es) y ANTES
 * de autorizar por rol, para que también quede un intento denegado (403).
 *
 * Se engancha a 'finish'/'close' de la respuesta: el resultado HTTP forma
 * parte del registro y la escritura en la base es asíncrona, así que el
 * cliente nunca espera a la auditoría.
 */
function auditoriaMiddleware(req, res, next) {
    const actor = req.user;
    const accion = ACCION_POR_METODO[req.method];
    if (!actor || !accion || !ROLES_AUDITADOS.includes(Number(actor.rol))) {
        return next();
    }

    const ruta = String(req.originalUrl || req.url || '').split('?')[0];
    const coincidencia = ENTIDADES.find(([prefijo]) => ruta.startsWith(prefijo));
    if (!coincidencia) return next();

    const [prefijo, entidad] = coincidencia;
    const idEnRuta = idDesdeRuta(ruta, prefijo);

    // El proxy usa esta marca para copiar la respuesta del microservicio
    // (ver `proxyRes` en app.js): de ahí sale el id de la fila creada.
    req.auditoria = { idEnRuta };

    let reflejado = false;
    const registrar = () => {
        if (reflejado) return;
        reflejado = true;
        const cuerpo = res.locals && res.locals.auditoriaCuerpo;
        guardarAuditoria({
            idUsuario: Number(actor.id),
            accion,
            entidad,
            idEntidad: String(idEnRuta || idDesdeRespuesta(cuerpo) || '').slice(0, 60),
            detalle: detalleAuditoria({
                metodo: req.method,
                ruta,
                estado: res.statusCode || 0,
                ip: ipDe(req),
                datos: datosSanos(cuerpo)
            })
        });
    };

    res.on('finish', registrar);
    // 'close' cubre desconexiones del cliente antes de terminar de enviar.
    res.on('close', registrar);

    next();
}

/**
 * Copia (sin intervenir el stream) el cuerpo de la respuesta del
 * microservicio para las peticiones que el middleware marcó con
 * `req.auditoria`. De ahí salen el id de la fila creada y el resumen que
 * va en el detalle. Se adjunta solo en mutaciones de administrador, así que
 * el volumen copiado es mínimo.
 */
function capturarRespuesta(proxyRes, req, res) {
    if (!req.auditoria) return;

    const pedazos = [];
    let peso = 0;
    proxyRes.on('data', (fragmento) => {
        peso += fragmento.length;
        if (peso <= LIMITE_RESPUESTA) pedazos.push(fragmento);
    });
    proxyRes.on('end', () => {
        try {
            res.locals = res.locals || {};
            res.locals.auditoriaCuerpo = JSON.parse(Buffer.concat(pedazos).toString('utf8'));
        } catch {
            // Respuesta sin cuerpo JSON (vacía o binaria): no hay nada que anotar.
        }
    });
}

module.exports = auditoriaMiddleware;
module.exports.capturarRespuesta = capturarRespuesta;
module.exports.consultarActividad = consultarActividad;
