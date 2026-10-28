const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifica el JWT en el gateway y propaga la identidad a los servicios
 * mediante headers internos x-user-*.
 */
function verifyToken(req, res, next) {
    if (!JWT_SECRET) {
        return res.status(500).json({ error: 'JWT_SECRET no configurado en el gateway' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
        if (!decoded || !decoded.id) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        req.user = decoded;
        req.headers['x-user-id'] = String(decoded.id);
        req.headers['x-user-role'] = String(decoded.tipo_usuario || '');
        req.headers['x-user-identificacion'] = String(decoded.identificacion || '');
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

module.exports = verifyToken;
