/**
 * Exige que el rol propagado por el gateway esté entre los permitidos.
 * Los ids son los del JWT y corresponden al catálogo de la tabla roles.
 */
function requireRoles(...roles) {
    const permitidos = roles.map(String);
    return (req, res, next) => {
        if (!req.actor) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        if (!permitidos.includes(String(req.actor.rol))) {
            return res.status(403).json({ error: 'No tienes permisos para esta acción' });
        }
        next();
    };
}

module.exports = requireRoles;
