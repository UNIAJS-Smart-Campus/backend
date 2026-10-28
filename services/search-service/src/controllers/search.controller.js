const { client, INDICATORS } = require('../config/elasticsearch');

const SEARCHABLE_FIELDS = {
    [INDICATORS.USUARIOS]: ['nombre', 'apellido', 'nombre_completo', 'correo', 'programa', 'identificacion', 'nombre_rol'],
    [INDICATORS.RECURSOS]: ['nombre_recurso', 'codigo', 'descripcion', 'ubicacion', 'tipo_recurso'],
    [INDICATORS.EVENTOS]: ['nombre_evento', 'descripcion', 'ubicacion', 'tipo_evento'],
    [INDICATORS.SOLICITUDES]: ['codigo', 'tipo', 'descripcion', 'solicitante', 'respuesta'],
    [INDICATORS.PQRS]: ['id_pqrs', 'tipo', 'descripcion'],
    [INDICATORS.INFO_ACADEMICA]: ['titulo', 'contenido', 'autor', 'categoria']
};

async function searchAll(req, res, next) {
    try {
        const { q, tipo, from = 0, size = 10 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                error: 'El término de búsqueda debe tener al menos 2 caracteres'
            });
        }

        const indices = tipo && INDICATORS[tipo.toUpperCase()]
            ? [INDICATORS[tipo.toUpperCase()]]
            : Object.values(INDICATORS);

        const searchPromises = indices.map(async (index) => {
            const fields = SEARCHABLE_FIELDS[index] || ['*'];
            const result = await client.search({
                index,
                from: parseInt(from),
                size: parseInt(size),
                query: {
                    multi_match: {
                        query: q,
                        fields: fields.map(f => f.includes('*') ? f : `${f}^1`),
                        type: 'best_fields',
                        fuzziness: 'AUTO',
                        prefix_length: 1
                    }
                },
                highlight: {
                    fields: fields.reduce((acc, field) => {
                        if (!field.includes('*')) {
                            acc[field] = { number_of_fragments: 1, fragment_size: 150 };
                        }
                        return acc;
                    }, {})
                }
            });

            return {
                index,
                total: result.hits.total.value,
                hits: result.hits.hits.map(hit => ({
                    id: hit._id,
                    score: hit._score,
                    source: hit._source,
                    highlight: hit.highlight
                }))
            };
        });

        const results = await Promise.all(searchPromises);
        const totalResults = results.reduce((sum, r) => sum + r.total, 0);

        res.json({
            success: true,
            query: q,
            total: totalResults,
            results: results.filter(r => r.total > 0)
        });
    } catch (error) {
        next(error);
    }
}

async function searchByIndex(req, res, next) {
    try {
        const { index } = req.params;
        const { q, from = 0, size = 20 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                error: 'El término de búsqueda debe tener al menos 2 caracteres'
            });
        }

        const indexName = INDICATORS[index.toUpperCase()];
        if (!indexName) {
            return res.status(404).json({
                error: `Índice '${index}' no encontrado`,
                available: Object.keys(INDICATORS)
            });
        }

        const fields = SEARCHABLE_FIELDS[indexName] || ['*'];

        const result = await client.search({
            index: indexName,
            from: parseInt(from),
            size: parseInt(size),
            query: {
                multi_match: {
                    query: q,
                    fields: fields.filter(f => !f.includes('*')),
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                    prefix_length: 1
                }
            },
            highlight: {
                fields: fields.reduce((acc, field) => {
                    if (!field.includes('*')) {
                        acc[field] = { number_of_fragments: 1, fragment_size: 150 };
                    }
                    return acc;
                }, {})
            }
        });

        res.json({
            success: true,
            index: indexName,
            total: result.hits.total.value,
            hits: result.hits.hits.map(hit => ({
                id: hit._id,
                score: hit._score,
                source: hit._source,
                highlight: hit.highlight
            }))
        });
    } catch (error) {
        next(error);
    }
}

async function suggest(req, res, next) {
    try {
        const { q, size = 5 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({ suggestions: [] });
        }

        const result = await client.search({
            index: Object.values(INDICATORS),
            size: parseInt(size),
            query: {
                multi_match: {
                    query: q,
                    type: 'phrase_prefix',
                    fields: ['nombre', 'apellido', 'nombre_completo', 'nombre_recurso', 'nombre_evento', 'titulo', 'solicitante']
                }
            },
            _source: ['nombre', 'apellido', 'nombre_completo', 'nombre_recurso', 'nombre_evento', 'titulo', 'solicitante', 'codigo', 'id_pqrs']
        });

        const suggestions = result.hits.hits.map(hit => {
            const source = hit._source;
            return {
                id: hit._id,
                index: hit._index,
                text: source.nombre_completo
                    || `${source.nombre || ''} ${source.apellido || ''}`.trim()
                    || source.nombre_recurso
                    || source.nombre_evento
                    || source.titulo
                    || source.solicitante
                    || source.codigo
                    || source.id_pqrs
            };
        });

        res.json({
            success: true,
            suggestions: [...new Map(suggestions.map(s => [s.text, s])).values()]
        });
    } catch (error) {
        next(error);
    }
}

async function getIndices(req, res, next) {
    try {
        const indices = await client.cat.indices({
            format: 'json',
            index: `${require('../config/elasticsearch').INDEX_PREFIX}*`
        });

        res.json({
            success: true,
            indices: indices.map(idx => ({
                name: idx.index,
                docs: parseInt(idx['docs.count']),
                size: idx['size']
            }))
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    searchAll,
    searchByIndex,
    suggest,
    getIndices
};
