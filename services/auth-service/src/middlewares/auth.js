const jwt = require('jsonwebtoken');

// Sin secreto configurado el servicio no arranca: un fallback hardcodeado
// permitiría firmar tokens válidos con una clave pública del repositorio.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error(
        'JWT_SECRET no está definido. Defínelo en el .env antes de arrancar auth-service.'
    );
}

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

module.exports = verifyToken;
