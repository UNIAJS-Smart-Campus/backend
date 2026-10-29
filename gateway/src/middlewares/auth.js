const jwt = require('jsonwebtoken');

// Sin secreto configurado el gateway no arranca: un fallback hardcodeado
// permitiría firmar tokens válidos con una clave pública del repositorio.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error(
        'JWT_SECRET no está definido. Defínelo en el .env antes de arrancar el gateway.'
    );
}

// Rutas públicas: sin token. El resto exige un JWT válido.
const RUTAS_PUBLICAS = [
    { metodo: 'POST', patron: /^\/api\/auth\/login$/ },
    { metodo: 'POST', patron: /^\/api\/auth\/register$/ },
    { metodo: 'POST', patron: /^\/api\/auth\/recuperar$/ },
    { metodo: 'POST', patron: /^\/api\/auth\/restablecer$/ }
];

function esPublica(req) {
    const ruta = req.originalUrl.split('?')[0];
    return RUTAS_PUBLICAS.some((r) => r.metodo === req.method && r.patron.test(ruta));
}

function authMiddleware(req, res, next) {
    if (esPublica(req)) return next();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    try {
        req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        next();
    } catch (error) {
        const mensaje =
            error.name === 'TokenExpiredError'
                ? 'Sesión expirada, vuelve a iniciar sesión'
                : 'Token inválido';
        return res.status(401).json({ error: mensaje });
    }
}

module.exports = authMiddleware;
