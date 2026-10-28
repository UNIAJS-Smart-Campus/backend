/**
 * Exige rol Administrador (1) o Administrativo (4).
 * Se acepta también el nombre del rol.
 */
function requireGestor(req, res, next) {
    const rol = String(req.actor?.rol ?? '').toLowerCase();
    const permitidos = ['1', '4', 'administrador', 'administrativo'];
    if (!permitidos.includes(rol)) {
        return res.status(403).json({ error: 'Requiere permisos de administración' });
    }
    next();
}

module.exports = requireGestor;
