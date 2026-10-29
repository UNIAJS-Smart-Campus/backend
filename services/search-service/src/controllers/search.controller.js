const { client, INDICATORS } = require('../config/elasticsearch');
const { puedeVerIndice, indicesPermitidos, permisosDePeticion } = require('../config/permisos');
const { reindexar } = require('../services/indexer');

const SEARCHABLE_FIELDS = {
    [INDICATORS.USUARIOS]: ['nombre', 'apellido', 'nombre_completo', 'correo', 'programa', 'identificacion', 'nombre_rol'],
    [INDICATORS.RECURSOS]: ['nombre_recurso', 'codigo', 'descripcion', 'ubicacion', 'tipo_recurso'],
    [INDICATORS.EVENTOS]: ['nombre_evento', 'descripcion', 'ubicacion', 'tipo_evento'],
    [INDICATORS.SOLICITUDES]: ['codigo', 'tipo', 'descripcion', 'solicitante', 'respuesta'],
    // Campos de radicación añadidos al esquema (asunto, area, nombre, ...).
    [INDICATORS.PQRS]: ['id_pqrs', 'tipo', 'descripcion', 'asunto', 'area', 'nombre', 'prioridad', 'sede', 'estado'],
    [INDICATORS.INFO_ACADEMICA]: ['titulo', 'contenido', 'autor', 'categoria', 'programa', 'estado'],
    [INDICATORS.RESERVAS]: ['recurso', 'tipo_recurso', 'ubicacion', 'usuario', 'motivo', 'observaciones', 'estado']
};

async function searchAll(req, res, next) {
    try {
        const { q, tipo, from = 0, size = 10 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                error: 'El término de búsqueda debe tener al menos 2 caracteres'
            });
        }

        const tipoPedido = tipo && INDICATORS[tipo.toUpperCase()];

        if (tipoPedido) {
            // Un tipo explícito que el rol no puede ver se rechaza en vez de
            // devolver una lista vacía, para que el front sepa que fue permisos.
            if (!puedeVerIndice(req, tipoPedido)) {
                return res.status(403).json({
                    error: 'No tienes permisos para buscar en esta entidad'
                });
            }
        }

        const indices = tipoPedido
            ? [tipoPedido]
            : indicesPermitidos(req);

        if (indices.length === 0) {
            return res.json({ success: true, query: q, total: 0, results: [] });
        }

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

        if (!puedeVerIndice(req, indexName)) {
            return res.status(403).json({
                error: 'No tienes permisos para buscar en esta entidad'
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

        const indicesVisibles = indicesPermitidos(req);
        if (indicesVisibles.length === 0) {
            return res.json({ success: true, suggestions: [] });
        }

        const result = await client.search({
            index: indicesVisibles,
            size: parseInt(size),
            query: {
                multi_match: {
                    query: q,
                    type: 'phrase_prefix',
                    fields: ['nombre', 'apellido', 'nombre_completo', 'nombre_recurso', 'nombre_evento', 'titulo', 'solicitante', 'asunto', 'area', 'codigo', 'recurso']
                }
            },
            _source: ['nombre', 'apellido', 'nombre_completo', 'nombre_recurso', 'nombre_evento', 'titulo', 'solicitante', 'codigo', 'id_pqrs', 'asunto', 'area', 'recurso']
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
                    || source.recurso
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

async function getIndices(req, res, next) {    try {
        const indices = await client.cat.indices({
            format: 'json',
            index: `${require('../config/elasticsearch').INDEX_PREFIX}*`
        });

        res.json({
            success: true,
            indices: indices
                .filter((idx) =>
                    puedeVerIndice(
                        req,
                        Object.values(INDICATORS).find(
                            (nombre) => nombre === idx.index
                        )
                    )
                )
                .map(idx => ({
                    name: idx.index,
                    docs: parseInt(idx['docs.count']),
                    size: idx['size']
                }))
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Reindexado en caliente. Solo Administrador (id_rol 1): reconstruye los
 * índices de Elasticsearch desde MySQL sin reiniciar el servicio.
 *
 * Body opcional: { indices: ["uajs_eventos"] }. Sin body reindexa todo.
 */
async function reindex(req, res, next) {
    try {
        const permisos = permisosDePeticion(req);
        // permisos === null significa "sin header de rol" (llamada interna):
        // se permite, igual que en el resto de comprobaciones.
        if (permisos && !permisos.includes('usuarios')) {
            return res.status(403).json({
                error: 'Solo un administrador puede reindexar'
            });
        }

        const solicitados = Array.isArray(req.body?.indices)
            ? req.body.indices.filter((nombre) =>
                  Object.values(INDICATORS).includes(nombre)
              )
            : null;

        const resultado = await reindexar(solicitados);

        res.json({
            success: true,
            reindexados: resultado.indices,
            errores: resultado.errores
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    searchAll,
    searchByIndex,
    suggest,
    getIndices,
    reindex
};
