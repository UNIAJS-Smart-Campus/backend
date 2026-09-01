const pool = require('../config/database');
const { client, INDICATORS } = require('../config/elasticsearch');

const INDEX_MAPPINGS = {
    [INDICATORS.USUARIOS]: {
        settings: {
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
        },
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
    await client.indices.create({
        index: indexName,
        ...INDEX_MAPPINGS[indexName]
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
    indexUsuarios,
    indexRecursos,
    indexEventos,
    indexSolicitudes,
    indexPQRS,
    indexInfoAcademica
};
