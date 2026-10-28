/**
 * Exige que el actor propagado por el gateway sea Administrador.
 * Se acepta el id de rol (1) o el nombre.
 */
function requireAdmin(req, res, next) {
    const rol = String(req.actor?.rol ?? '');
    if (rol !== '1' && rol.toLowerCase() !== 'administrador') {
        return res.status(403).json({ error: 'Requiere permisos de administrador' });
    }
    next();
}

module.exports = requireAdmin;
