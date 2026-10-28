/**
 * Toma la identidad que el gateway validó y propagó en los headers x-user-*.
 * Los servicios no aceptan identidad enviada por el cliente porque el gateway
 * la sobrescribe (o la elimina en rutas públicas).
 */
function requireActor(req, res, next) {
    const id = Number(req.headers['x-user-id']);
    const rol = String(req.headers['x-user-role'] || '');

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    req.actor = { id, rol };
    next();
}

module.exports = requireActor;
