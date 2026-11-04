const jwt = require('jsonwebtoken');

// Sin secreto configurado el servicio no arranca: un fallback hardcodeado
// permitiría firmar tokens válidos con una clave pública del repositorio.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error(
        'JWT_SECRET no está definido. Defínelo en el .env antes de arrancar auth-service.'
    );
}

// Nombre de la cookie HttpOnly que transporta el access JWT. El frontend
// no puede leerla (HttpOnly), por lo que no hay token en localStorage
// expuesto a XSS.
const ACCESS_COOKIE = 'access_token';

function tokenDe(req) {
    // 1) Cookie HttpOnly (canal principal tras el fix de token).
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/(?:^|;\s*)access_token=([^;]+)/);
    if (match) return match[1];

    // 2) Cabecera Authorization: Bearer (compatibilidad con clientes que
    //    aún envíen el token por cabecera; p. ej. llamadas de servidor a
    //    servidor). Se mantiene como fallback, no como canal principal.
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    return null;
}

function verifyToken(req, res, next) {
    const token = tokenDe(req);
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

module.exports = verifyToken;
module.exports.ACCESS_COOKIE = ACCESS_COOKIE;
