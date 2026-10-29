// ============================================================
// REINDEXADO POR CAMBIO
//
// Los microservicios no avisan a Elasticsearch cuando escriben: hasta ahora
// el índice solo se actualizaba reindexando a mano. En vez de entrar en los
// seis servicios (seis Dockerfiles, seis clientes HTTP y acoplamiento), el
// gateway lo resuelve en UN solo punto: ya enruta todas las mutaciones, así
// que tras un POST/PUT/PATCH/DELETE que toca una tabla indexada dispara el
// reindexado del índice correspondiente.
//
// El aviso es "best-effort" y no bloquea la respuesta al cliente: si el
// search-service está caído, la escritura igual se devuelve al front.
// ============================================================

// Prefijo de la API del gateway -> índice de Elasticsearch que hay que
// reindexar tras una escritura. Los prefijos que no aparecen aquí no se
// indexan (notificaciones, configuración, auth).
const INDICE_POR_PREFIJO = {
    '/api/users': 'uajs_usuarios',
    '/api/resources': 'uajs_recursos',
    '/api/events': 'uajs_eventos',
    '/api/requests': 'uajs_solicitudes',
    '/api/feedback': 'uajs_pqrs',
    '/api/academic-info': 'uajs_info_academica',
    '/api/reservations': 'uajs_reservas'
};

// Métodos que modifican datos.
const METODOS_ESCRITURA = ['POST', 'PUT', 'PATCH', 'DELETE'];

module.exports = {
    INDICE_POR_PREFIJO,
    METODOS_ESCRITURA
};
