const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en el entorno');
}

// Rutas que no requieren token. Todo lo demás pasa por verificación JWT.
const RUTAS_PUBLICAS = [
    { method: 'POST', path: '/api/auth/login' },
    { method: 'POST', path: '/api/auth/register' },
    { method: 'GET', path: '/api/health' },
    { method: 'GET', path: '/health' },
    { method: 'GET', path: '/' }
];

function esPublica(req) {
    const path = req.originalUrl.split('?')[0].replace(/\/+$/, '') || '/';
    return RUTAS_PUBLICAS.some(
        (ruta) => ruta.method === req.method && ruta.path === path
    );
}

/**
 * Verifica el JWT en el gateway y propaga la identidad a los servicios
 * mediante headers `x-user-*`. Los headers enviados por el cliente se
 * eliminan siempre para que no puedan suplantar a otro usuario.
 */
function authMiddleware(req, res, next) {
    delete req.headers['x-user-id'];
    delete req.headers['x-user-role'];
    delete req.headers['x-user-name'];
    delete req.headers['x-user-usuario'];

    if (req.method === 'OPTIONS') {
        return next();
    }

    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

    if (esPublica(req)) {
        return next();
    }

    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const id = Number(decoded.id ?? decoded.id_usuario);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        req.user = decoded;
        req.headers['x-user-id'] = String(id);
        req.headers['x-user-role'] = String(decoded.rol ?? '');
        req.headers['x-user-name'] = String(decoded.nombre ?? '');
        req.headers['x-user-usuario'] = String(decoded.usuario ?? '');
        next();
    } catch {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

module.exports = authMiddleware;
module.exports.esPublica = esPublica;
module.exports.RUTAS_PUBLICAS = RUTAS_PUBLICAS;
