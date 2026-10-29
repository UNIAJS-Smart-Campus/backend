const { INDICATORS } = require('./elasticsearch');

// ============================================================
// PERMISOS POR ÍNDICE
//
// Elasticsearch indexa TODO y no sabe de roles. El gateway valida el JWT y
// reenvía x-user-rol (id numérico de `roles`) y x-user-id; aquí se traduce ese
// rol a los permisos del front (ver frontend/src/utils/users.js) para decidir
// qué índices puede consultar cada usuario.
//
// Sin este filtro, un Estudiante recibía sugerencias de uajs_usuarios, algo
// que su rol no puede ver en la lista.
// ============================================================

// id_rol (tabla `roles`) -> nombre del rol
const ROLES = {
    1: 'Administrador',
    2: 'Estudiante',
    3: 'Docente',
    4: 'Administrativo'
};

// Copia de los permisos por rol del front. Se mantiene aquí para que el
// servicio no dependa del bundle del cliente.
const PERMISOS_POR_ROL = {
    Administrador: [
        'dashboard', 'usuarios', 'solicitudes', 'reservas', 'recursos',
        'eventos', 'notificaciones', 'pqrs', 'reportes', 'perfil',
        'configuracion', 'info_academica', 'gestion_pqrs'
    ],
    Administrativo: [
        'dashboard', 'solicitudes', 'reservas', 'recursos', 'eventos',
        'notificaciones', 'pqrs', 'perfil', 'reportes', 'configuracion',
        'info_academica', 'gestion_pqrs'
    ],
    Docente: [
        'dashboard', 'solicitudes', 'reservas', 'recursos', 'eventos',
        'notificaciones', 'pqrs', 'perfil', 'info_academica', 'configuracion'
    ],
    Estudiante: [
        'dashboard', 'solicitudes', 'reservas', 'recursos', 'eventos',
        'notificaciones', 'pqrs', 'perfil', 'info_academica', 'configuracion'
    ]
};

// Índice de Elasticsearch -> permiso necesario para consultarlo.
const PERMISO_POR_INDICE = {
    [INDICATORS.USUARIOS]: 'usuarios',
    [INDICATORS.RECURSOS]: 'recursos',
    [INDICATORS.EVENTOS]: 'eventos',
    [INDICATORS.SOLICITUDES]: 'solicitudes',
    [INDICATORS.PQRS]: 'pqrs',
    [INDICATORS.INFO_ACADEMICA]: 'info_academica',
    [INDICATORS.RESERVAS]: 'reservas'
};

/**
 * Permisos del usuario que hizo la petición, a partir del header x-user-rol
 * que pone el gateway (id numérico de la tabla `roles`).
 *
 * Si no llega el header (llamada interna, prueba) se devuelven TODOS los
 * permisos para no romper el funcionamiento directo del servicio.
 */
function permisosDePeticion(req) {
    const idRol = Number(req.headers['x-user-rol']);

    if (!idRol || !ROLES[idRol]) {
        return null; // null = sin restricción
    }
    return PERMISOS_POR_ROL[ROLES[idRol]] || [];
}

/** ¿Puede el usuario consultar este índice? */
function puedeVerIndice(req, indice) {
    const permisos = permisosDePeticion(req);
    if (!permisos) return true; // sin header de rol no se restringe

    const permiso = PERMISO_POR_INDICE[indice];
    if (!permiso) return true; // índice no mapeado: no se oculta
    return permisos.includes(permiso);
}

/** Índices de Elasticsearch que el usuario de la petición puede consultar. */
function indicesPermitidos(req) {
    return Object.values(INDICATORS).filter((indice) => puedeVerIndice(req, indice));
}

module.exports = {
    ROLES,
    PERMISOS_POR_ROL,
    PERMISO_POR_INDICE,
    permisosDePeticion,
    puedeVerIndice,
    indicesPermitidos
};
