/**
 * ============================================================
 * ALL-IN-ONE RUNNER
 * ============================================================
 * Arranca el gateway y los 11 microservicios en UN solo
 * proceso Node, cada uno en su propio puerto de siempre.
 *
 * Existe porque Render (y plataformas similares) ejecutan un
 * contenedor por servicio y no pueden correr docker-compose.
 * El gateway los sigue llamando por HTTP a localhost:300x, así
 * que el código de los servicios no cambia.
 *
 * Uso:  node start-all.js
 * ============================================================
 */

// ------------------------------------------------------------
// 1) Entorno por defecto. DEBE ejecutarse ANTES de requerir
//    cualquier app: varios módulos leen estas variables al
//    cargarse (webhooks, proxy de reindexado, JWT).
// ------------------------------------------------------------
const env = process.env;

env.ALL_IN_ONE = env.ALL_IN_ONE || '1';
env.NOTIFICATIONS_WEBHOOK_URL =
    env.NOTIFICATIONS_WEBHOOK_URL || 'http://localhost:3005/api/notifications/webhook';
env.SEARCH_SERVICE_URL = env.SEARCH_SERVICE_URL || 'http://localhost:3011';

const http = require('http');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

// ------------------------------------------------------------
// 2) Opciones de base de datos (compartidas con los servicios).
// ------------------------------------------------------------
const dbOptions = {
    host: env.DB_HOST,
    port: Number(env.DB_PORT) || 3306,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(env.DB_CONN_LIMIT) || 10,
    // TLS opcional: servicios de base de datos externos (p. ej.
    // TiDB Serverless) exigen conexión cifrada.
    ...(env.DB_SSL === '1'
        ? { ssl: { rejectUnauthorized: env.DB_SSL_VERIFY !== '0' } }
        : {})
};

// ------------------------------------------------------------
// 3) Semilla de la base. En docker-compose lo hace el contenedor
//    db-init; aquí lo hace el propio proceso: si la tabla
//    `usuarios` no existe, importa uajs_smart_campus.sql.
// ------------------------------------------------------------
async function inicializarBaseDeDatos() {
    if (!dbOptions.host || !dbOptions.database) {
        console.warn('[db] DB_HOST/DB_NAME no definidos: se omite la semilla.');
        return;
    }

    const semillaPath = path.resolve(__dirname, 'uajs_smart_campus.sql');
    const MAX_INTENTOS = 30;

    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
        let conexion;
        try {
            conexion = await mysql.createConnection({
                ...dbOptions,
                multipleStatements: true
            });

            const [filas] = await conexion.query(
                `SELECT COUNT(*) AS n FROM information_schema.tables
                 WHERE table_schema = ? AND table_name = 'usuarios'`,
                [dbOptions.database]
            );

            if (Number(filas[0].n) > 0) {
                console.log('[db] Base de datos ya inicializada.');
                return;
            }

            console.log('[db] Importando uajs_smart_campus.sql ...');
            const sql = fs.readFileSync(semillaPath, 'utf8');
            await conexion.query(sql);
            console.log('[db] Semilla importada correctamente.');
            return;
        } catch (error) {
            console.warn(`[db] Intento ${intento}/${MAX_INTENTOS} falló: ${error.message}`);
            await new Promise((res) => setTimeout(res, 5000));
        } finally {
            if (conexion) conexion.end().catch(() => {});
        }
    }

    console.error('[db] No se pudo inicializar la base de datos (se seguirá intentando por peticion).');
}

// ------------------------------------------------------------
// 4) Servicios. [etiqueta, puerto, modulo, ¿socket.io?]
//    Los puertos son los mismos que usa docker-compose y los
//    mismos que el gateway espera (ver gateway/src/config/routes.js).
// ------------------------------------------------------------
const SERVICIOS = [
    ['auth', 3001, './services/auth-service/src/app'],
    ['users', 3002, './services/users-service/src/app'],
    ['events', 3003, './services/events-service/src/app'],
    ['reservations', 3004, './services/reservations-service/src/app'],
    ['notifications', 3005, './services/notifications-service/src/app', true],
    ['requests', 3006, './services/requests-service/src/app'],
    ['resources', 3007, './services/resources-service/src/app'],
    ['feedback', 3008, './services/feedback-service/src/app'],
    ['academic-info', 3009, './services/academic-info-service/src/app'],
    ['configuration', 3010, './services/configuration-service/src/app'],
    ['search', 3011, './services/search-service/src/app']
];

// ------------------------------------------------------------
// 5) Resiliencia: en un solo proceso, un error no controlado de
//    un servicio no debe tumbar el resto. Se registra y sigue.
// ------------------------------------------------------------
process.on('uncaughtException', (error) => {
    console.error('[all-in-one] uncaughtException:', error);
});
process.on('unhandledRejection', (error) => {
    console.error('[all-in-one] unhandledRejection:', error);
});

// ------------------------------------------------------------
// 6) Arranque.
// ------------------------------------------------------------
for (const [nombre, puerto, modulo] of SERVICIOS) {
    try {
        const app = require(modulo);
        const servidor = http.createServer(app);

        // Socket.IO necesita el servidor HTTP, no solo la app.
        if (nombre === 'notifications') {
            const { initRealtime } = require('./services/notifications-service/src/realtime');
            initRealtime(servidor);
        }

        servidor.listen(puerto, () => {
            console.log(`[all-in-one] ${nombre} escuchando en :${puerto}`);
        });
        servidor.on('error', (error) => {
            console.error(`[all-in-one] error en ${nombre}:`, error);
        });
    } catch (error) {
        console.error(`[all-in-one] no se pudo cargar ${nombre}:`, error);
    }
}

// ------------------------------------------------------------
// 7) Gateway: el único expuesto a Render (PORT). Reenvía a los
//    servicios de arriba y hace el proxy de WebSocket.
// ------------------------------------------------------------
try {
    const gatewayApp = require('./gateway/src/app');
    const servidorGateway = http.createServer(gatewayApp);

    const socketProxy = gatewayApp.locals.socketProxy;
    if (socketProxy?.upgrade) {
        // El upgrade de /socket.io nunca dispara el primer HTTP:
        // hay que engancharlo a mano (igual que en server.js).
        servidorGateway.on('upgrade', socketProxy.upgrade);
    }

    const puertoGateway = Number(env.PORT) || 3000;
    servidorGateway.listen(puertoGateway, () => {
        console.log(`[all-in-one] gateway escuchando en :${puertoGateway} (PORT=${env.PORT || 'no definido'})`);
    });
    servidorGateway.on('error', (error) => {
        console.error('[all-in-one] error en gateway:', error);
    });
} catch (error) {
    console.error('[all-in-one] no se pudo cargar el gateway:', error);
}

// La semilla corre en paralelo: el gateway responde al health
// check aunque la base tarde en estar lista.
inicializarBaseDeDatos();
