const jwt = require('jsonwebtoken');

// Sin secreto configurado el gateway no arranca: un fallback hardcodeado
// permitiría firmar tokens válidos con una clave pública del repositorio.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error(
        'JWT_SECRET no está definido. Defínelo en el .env antes de arrancar el gateway.'
    );
}

// Cookie HttpOnly que transporta el access JWT. El frontend no puede leerla
// (HttpOnly), así que no hay token en localStorage expuesto a XSS.
const ACCESS_COOKIE = 'access_token';

// Rutas públicas: sin token. Ahora incluyen refresh y logout porque son los
// puntos de entrada para renovar o cerrar una sesión (no exigen JWT válido).
const RUTAS_PUBLICAS = [
    { metodo: 'POST', patron: /^\/api\/auth\/login$/ },
    { metodo: 'POST', patron: /^\/api\/auth\/register$/ },
    { metodo: 'POST', patron: /^\/api\/auth\/recuperar$/ },
    { metodo: 'POST', patron: /^\/api\/auth\/restablecer$/ },
    { metodo: 'POST', patron: /^\/api\/auth\/refresh$/ },
    { metodo: 'POST', patron: /^\/api\/auth\/logout$/ }
];

function cookieDe(req, nombre) {
    const cookies = req.headers.cookie || '';
    const match = cookies.match(new RegExp('(?:^|;\\s*)' + nombre + '=([^;]+)'));
    return match ? match[1] : null;
}

function tokenDe(req) {
    // 1) Cookie HttpOnly (canal principal tras el fix de token).
    const t = cookieDe(req, ACCESS_COOKIE);
    if (t) return t;

    // 2) Cabecera Authorization: Bearer (fallback para clientes que aún la
    //    envíen; p. ej. llamadas de servidor a servidor).
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return null;
}

function esPublica(req) {
    const ruta = req.originalUrl.split('?')[0];
    return RUTAS_PUBLICAS.some((r) => r.metodo === req.method && r.patron.test(ruta));
}

function authMiddleware(req, res, next) {
    if (esPublica(req)) return next();

    const token = tokenDe(req);
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

module.exports = authMiddleware;
module.exports.ACCESS_COOKIE = ACCESS_COOKIE;
