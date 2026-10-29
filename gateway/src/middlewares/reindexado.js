const { INDICE_POR_PREFIJO, METODOS_ESCRITURA } = require('../config/reindexado');

// URL interna del search-service (nombre de contenedor en docker-compose).
const SEARCH_URL = process.env.SEARCH_SERVICE_URL || 'http://search-service:3011';

// Espera entre reindexados del MISMO índice. Una ráfaga de escrituras
// (crear 10 usuarios seguidos) no debe lanzar 10 reindexados: se agrupan y
// se reindexa una sola vez pasado el margen.
const ESPERA_MS = Number(process.env.SEARCH_REINDEX_DEBOUNCE_MS) || 3000;

// Tiempo máximo que se espera al search-service antes de rendirse. Es una
// llamada de fondo: nunca debe colgar nada. Un reindexado de un índice tarda
// ~1,5 s en caliente; se da margen porque el primero (índice recién creado)
// puede tardar bastante más.
const TIMEOUT_MS = Number(process.env.SEARCH_REINDEX_TIMEOUT_MS) || 15000;

// Estado por índice:
//   - temporizadores: setTimeout pendiente (debounce antes de lanzar).
//   - enVuelo: hay un reindexado en curso para ese índice.
//   - pendiente: llegó otra escritura mientras había uno en curso; al
//     terminar se lanza un único reindexado más (no una cola).
const temporizadores = new Map();
const enVuelo = new Set();
const pendiente = new Set();

/** Índice que corresponde a la URL pedida, o null si no se indexa. */
function indiceDeUrl(url) {
    const ruta = url.split('?')[0];
    return (
        Object.entries(INDICE_POR_PREFIJO).find(([prefijo]) =>
            ruta.startsWith(prefijo)
        )?.[1] || null
    );
}

/** Dispara el reindexado del índice sin bloquear ni propagar errores. */
async function reindexarIndice(indice) {
    if (enVuelo.has(indice)) {
        // Ya se está reindexando: basta con recordar que hace falta otra
        // pasada al terminar, para no acumular peticiones.
        pendiente.add(indice);
        return;
    }

    enVuelo.add(indice);
    const controlador = new AbortController();
    const timeout = setTimeout(() => controlador.abort(), TIMEOUT_MS);

    try {
        const respuesta = await fetch(`${SEARCH_URL}/api/search/reindex`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ indices: [indice] }),
            signal: controlador.signal
        });

        if (!respuesta.ok) {
            console.warn(
                `Reindexado de ${indice} falló: HTTP ${respuesta.status}`
            );
        }
    } catch (error) {
        // El search-service caído no puede afectar a la escritura original.
        console.warn(`Reindexado de ${indice} no disponible: ${error.message}`);
    } finally {
        clearTimeout(timeout);
        enVuelo.delete(indice);

        if (pendiente.delete(indice)) {
            agendarReindexado(indice);
        }
    }
}

/** Agenda el reindexado con debounce por índice. */
function agendarReindexado(indice) {
    // Ya hay uno programado o corriendo: no se duplica.
    if (temporizadores.has(indice)) return;
    if (enVuelo.has(indice)) {
        pendiente.add(indice);
        return;
    }

    const id = setTimeout(() => {
        temporizadores.delete(indice);
        reindexarIndice(indice);
    }, ESPERA_MS);

    // No mantiene vivo el proceso por sí solo.
    if (typeof id.unref === 'function') id.unref();
    temporizadores.set(indice, id);
}

/**
 * Middleware: observa la respuesta de las mutaciones y, si fueron exitosas y
 * tocan una tabla indexada, agenda el reindexado del índice.
 *
 * Se engancha a 'finish' (la respuesta ya se envió), así el cliente nunca
 * espera a Elasticsearch.
 */
function reindexadoMiddleware(req, res, next) {
    if (!METODOS_ESCRITURA.includes(req.method)) return next();

    const indice = indiceDeUrl(req.originalUrl || req.url);
    if (!indice) return next();

    res.on('finish', () => {
        // Solo si el backend aceptó el cambio (2xx). Un 4xx/5xx no alteró
        // datos y no hay nada que reindexar.
        if (res.statusCode >= 200 && res.statusCode < 300) {
            agendarReindexado(indice);
        }
    });

    return next();
}

module.exports = reindexadoMiddleware;
