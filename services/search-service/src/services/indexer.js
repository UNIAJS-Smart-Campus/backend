const pool = require('../config/database');
const { client, INDICATORS } = require('../config/elasticsearch');

// Analizador español: debe declararse en CADA índice, porque los mappings
// de abajo lo referencian y Elasticsearch no lo hereda entre índices.
const ANALYSIS = {
    analysis: {
        analyzer: {
            spanish_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding', 'spanish_stop']
            }
        },
        filter: {
            spanish_stop: {
                type: 'stop',
                stopwords: '_spanish_'
            }
        }
    }
};

const INDEX_MAPPINGS = {
    [INDICATORS.USUARIOS]: {
        settings: ANALYSIS,
        mappings: {
            properties: {
                id_usuario: { type: 'integer' },
                nombre: { type: 'text', analyzer: 'spanish_analyzer' },
                apellido: { type: 'text', analyzer: 'spanish_analyzer' },
                nombre_completo: { type: 'text', analyzer: 'spanish_analyzer' },
                correo: { type: 'keyword' },
                programa: { type: 'text', analyzer: 'spanish_analyzer' },
                tipo_usuario: { type: 'keyword' },
                estado: { type: 'keyword' },
                identificacion: { type: 'keyword' },
                nombre_rol: { type: 'keyword' }
            }
        }
    },
    [INDICATORS.RECURSOS]: {
        mappings: {
            properties: {
                id_recurso: { type: 'integer' },
                nombre_recurso: { type: 'text', analyzer: 'spanish_analyzer' },
                codigo: { type: 'keyword' },
                tipo_recurso: { type: 'keyword' },
                descripcion: { type: 'text', analyzer: 'spanish_analyzer' },
                ubicacion: { type: 'text', analyzer: 'spanish_analyzer' },
                capacidad: { type: 'integer' },
                estado: { type: 'keyword' },
                disponibilidad: { type: 'keyword' }
            }
        }
    },
    [INDICATORS.EVENTOS]: {
        mappings: {
            properties: {
                id_evento: { type: 'integer' },
                nombre_evento: { type: 'text', analyzer: 'spanish_analyzer' },
                descripcion: { type: 'text', analyzer: 'spanish_analyzer' },
                ubicacion: { type: 'text', analyzer: 'spanish_analyzer' },
                tipo_evento: { type: 'keyword' },
                estado: { type: 'keyword' },
                fecha: { type: 'date' },
                hora_inicio: { type: 'keyword' },
                hora_fin: { type: 'keyword' },
                cupo: { type: 'integer' },
                inscritos: { type: 'integer' }
            }
        }
    },
    [INDICATORS.SOLICITUDES]: {
        mappings: {
            properties: {
                id_solicitud: { type: 'integer' },
                codigo: { type: 'keyword' },
                tipo: { type: 'keyword' },
                descripcion: { type: 'text', analyzer: 'spanish_analyzer' },
                solicitante: { type: 'text', analyzer: 'spanish_analyzer' },
                estado: { type: 'keyword' },
                respuesta: { type: 'text', analyzer: 'spanish_analyzer' },
                fecha_solicitud: { type: 'date' }
            }
        }
    },
    [INDICATORS.PQRS]: {
        mappings: {
            properties: {
                id_pqrs: { type: 'keyword' },
                tipo: { type: 'keyword' },
                descripcion: { type: 'text', analyzer: 'spanish_analyzer' },
                // Campos de radicación añadidos al esquema.
                asunto: { type: 'text', analyzer: 'spanish_analyzer' },
                area: { type: 'text', analyzer: 'spanish_analyzer' },
                nombre: { type: 'text', analyzer: 'spanish_analyzer' },
                identificacion: { type: 'keyword' },
                prioridad: { type: 'keyword' },
                sede: { type: 'keyword' },
                tipo_perfil: { type: 'keyword' },
                asignado_a: { type: 'text', analyzer: 'spanish_analyzer' },
                estado: { type: 'keyword' },
                fecha: { type: 'date' }
            }
        }
    },
    [INDICATORS.INFO_ACADEMICA]: {
        mappings: {
            properties: {
                id_publicacion: { type: 'integer' },
                titulo: { type: 'text', analyzer: 'spanish_analyzer' },
                categoria: { type: 'keyword' },
                contenido: { type: 'text', analyzer: 'spanish_analyzer' },
                autor: { type: 'text', analyzer: 'spanish_analyzer' },
                // Campos añadidos al esquema.
                programa: { type: 'text', analyzer: 'spanish_analyzer' },
                tipo_vigencia: { type: 'keyword' },
                estado: { type: 'keyword' },
                destacado: { type: 'boolean' },
                fecha: { type: 'date' }
            }
        }
    },
    [INDICATORS.RESERVAS]: {
        mappings: {
            properties: {
                id_reserva: { type: 'integer' },
                id_usuario: { type: 'integer' },
                id_recurso: { type: 'integer' },
                // Se indexan los nombres resueltos (no solo los ids), que es
                // lo que un usuario escribe al buscar: "laboratorio de redes".
                recurso: { type: 'text', analyzer: 'spanish_analyzer' },
                tipo_recurso: { type: 'keyword' },
                ubicacion: { type: 'text', analyzer: 'spanish_analyzer' },
                usuario: { type: 'text', analyzer: 'spanish_analyzer' },
                motivo: { type: 'text', analyzer: 'spanish_analyzer' },
                observaciones: { type: 'text', analyzer: 'spanish_analyzer' },
                estado: { type: 'keyword' },
                fecha: { type: 'date' }
            }
        }
    }
};

async function createIndex(indexName) {
    const exists = await client.indices.exists({ index: indexName });
    if (exists) {
        await client.indices.delete({ index: indexName });
    }
    const config = INDEX_MAPPINGS[indexName];
    await client.indices.create({
        index: indexName,
        settings: ANALYSIS,
        mappings: config.mappings
    });
    console.log(`Índice ${indexName} creado correctamente`);
}

async function indexUsuarios() {
    const [rows] = await pool.query(`
        SELECT u.*, r.nombre_rol
        FROM usuarios u
        LEFT JOIN roles r ON u.id_rol = r.id_rol
    `);
    const operations = rows.flatMap(doc => [
        { index: { _index: INDICATORS.USUARIOS, _id: doc.id_usuario.toString() } },
        {
            ...doc,
            nombre_completo: `${doc.nombre} ${doc.apellido}`
        }
    ]);
    if (operations.length > 0) {
        await client.bulk({ refresh: true, operations });
    }
    console.log(`${rows.length} usuarios indexados`);
}

async function indexRecursos() {
    const [rows] = await pool.query('SELECT * FROM recursos');
    const operations = rows.flatMap(doc => [
        { index: { _index: INDICATORS.RECURSOS, _id: doc.id_recurso.toString() } },
        doc
    ]);
    if (operations.length > 0) {
        await client.bulk({ refresh: true, operations });
    }
    console.log(`${rows.length} recursos indexados`);
}

async function indexEventos() {
    const [rows] = await pool.query('SELECT * FROM eventos_y_actividades');
    const operations = rows.flatMap(doc => [
        { index: { _index: INDICATORS.EVENTOS, _id: doc.id_evento.toString() } },
        doc
    ]);
    if (operations.length > 0) {
        await client.bulk({ refresh: true, operations });
    }
    console.log(`${rows.length} eventos indexados`);
}

async function indexSolicitudes() {
    const [rows] = await pool.query('SELECT * FROM solicitudes');
    const operations = rows.flatMap(doc => [
        { index: { _index: INDICATORS.SOLICITUDES, _id: doc.id_solicitud.toString() } },
        doc
    ]);
    if (operations.length > 0) {
        await client.bulk({ refresh: true, operations });
    }
    console.log(`${rows.length} solicitudes indexadas`);
}

async function indexPQRS() {
    const [rows] = await pool.query('SELECT * FROM pqrs');
    const operations = rows.flatMap(doc => [
        { index: { _index: INDICATORS.PQRS, _id: doc.id_pqrs } },
        doc
    ]);
    if (operations.length > 0) {
        await client.bulk({ refresh: true, operations });
    }
    console.log(`${rows.length} PQRS indexadas`);
}

async function indexInfoAcademica() {
    const [rows] = await pool.query('SELECT * FROM info_academica');
    const operations = rows.flatMap(doc => [
        { index: { _index: INDICATORS.INFO_ACADEMICA, _id: doc.id_publicacion.toString() } },
        doc
    ]);
    if (operations.length > 0) {
        await client.bulk({ refresh: true, operations });
    }
    console.log(`${rows.length} publicaciones académicas indexadas`);
}

async function indexReservas() {
    // Se resuelven los nombres (recurso, usuario) para que la búsqueda
    // encuentre la reserva por lo que el usuario escribe, no por ids.
    const [rows] = await pool.query(`
        SELECT r.id_reserva, r.id_usuario, r.id_recurso,
               r.fecha_reserva, r.hora_inicio, r.hora_fin,
               r.motivo, r.observaciones, r.estado,
               rec.nombre_recurso AS recurso,
               rec.tipo_recurso,
               rec.ubicacion,
               CONCAT(u.nombre, ' ', u.apellido) AS usuario
        FROM reservas r
        LEFT JOIN recursos rec ON r.id_recurso = rec.id_recurso
        LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
    `);
    const operations = rows.flatMap(doc => [
        { index: { _index: INDICATORS.RESERVAS, _id: doc.id_reserva.toString() } },
        { ...doc, fecha: doc.fecha_reserva }
    ]);
    if (operations.length > 0) {
        await client.bulk({ refresh: true, operations });
    }
    console.log(`${rows.length} reservas indexadas`);
}

// Índice de Elasticsearch -> función que lo rellena desde MySQL.
const INDEXADORES = {
    [INDICATORS.USUARIOS]: indexUsuarios,
    [INDICATORS.RECURSOS]: indexRecursos,
    [INDICATORS.EVENTOS]: indexEventos,
    [INDICATORS.SOLICITUDES]: indexSolicitudes,
    [INDICATORS.PQRS]: indexPQRS,
    [INDICATORS.INFO_ACADEMICA]: indexInfoAcademica,
    [INDICATORS.RESERVAS]: indexReservas
};

/**
 * Reindexa (recreando el índice) uno o varios índices sin cerrar el pool ni
 * el cliente de Elasticsearch. Pensado para llamarse desde el propio servicio
 * en caliente, no como script de consola.
 *
 * @param {string[]} [indices] Nombres exactos de índice. Sin argumento: todos.
 * @returns {Promise<{indices:string[], errores:Array}>}
 */
async function reindexar(indices) {
    const objetivos = (indices && indices.length
        ? indices
        : Object.values(INDICATORS)
    ).filter((nombre) => INDEXADORES[nombre]);

    const errores = [];
    for (const nombre of objetivos) {
        try {
            await createIndex(nombre);
            await INDEXADORES[nombre]();
        } catch (error) {
            errores.push({ index: nombre, error: error.message });
        }
    }
    return { indices: objetivos, errores };
}

async function run() {
    console.log('Iniciando indexación...');
    try {
        for (const indexName of Object.values(INDICATORS)) {
            await createIndex(indexName);
        }
        await indexUsuarios();
        await indexRecursos();
        await indexEventos();
        await indexSolicitudes();
        await indexPQRS();
        await indexInfoAcademica();
        await indexReservas();
        console.log('Indexación completada exitosamente');
    } catch (error) {
        console.error('Error en indexación:', error);
        process.exit(1);
    } finally {
        await pool.end();
        await client.close();
    }
}

if (require.main === module) {
    run();
}

module.exports = {
    run,
    reindexar,
    indexUsuarios,
    indexRecursos,
    indexEventos,
    indexSolicitudes,
    indexPQRS,
    indexInfoAcademica,
    indexReservas
};
