const requireActor = require('./actor');

/**
 * Exige que el actor propagado por el gateway sea Administrador.
 * Se acepta el id de rol (1) o el nombre, para no acoplar el contrato.
 */
function requireAdmin(req, res, next) {
    requireActor(req, res, () => {
        if (req.actor.rol !== '1' && req.actor.rol.toLowerCase() !== 'administrador') {
            return res.status(403).json({ error: 'Requiere permisos de administrador' });
        }
        next();
    });
}

module.exports = requireAdmin;
