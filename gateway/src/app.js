const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const routes = require('./config/routes');
const authMiddleware = require('./middlewares/auth');
const auditoriaMiddleware = require('./middlewares/auditoria');
const { sesionMiddleware } = require('./middlewares/sesiones');
const reindexadoMiddleware = require('./middlewares/reindexado');

const app = express();

// Detrás de nginx/Vercel/el proxy de Docker, la IP real llega en
// X-Forwarded-For. Sin esto, el rate limit contaría a todos como la misma IP.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Cabeceras de seguridad en TODA respuesta del API (antes solo las ponía
// Vercel en el frontend). X-Frame-Options/HSTS/nosniff etc. ya no dependen
// de que el cliente los aplique.
// - crossOriginResourcePolicy 'cross-origin': el frontend (Vercel) consume
//   este API desde otro origen; el valor por defecto de helmet ('same-origin')
//   bloquearía esas respuestas.
// - contentSecurityPolicy off: el gateway solo devuelve JSON; la CSP útil es
//   la del frontend, que se define en vercel.json.
app.use(helmet({
	crossOriginResourcePolicy: { policy: 'cross-origin' },
	// El gateway solo devuelve JSON: nadie debe incrustar estas respuestas.
	// En el frontend la regla ya es DENY (vercel.json).
	// Nota: en helmet 8 la opción se llama xFrameOptions (frameOptions se ignora).
	xFrameOptions: { action: 'deny' },
	contentSecurityPolicy: false
}));

// Compresión gzip de las respuestas JSON. Sin esto, cada lista que sale del
// gateway viaja sin comprimir a Vercel y a los móviles (un listado de
// notificaciones o usuarios puede ser 4-5 veces más pesado). Se coloca antes
// del proxy para que también cubra las respuestas reenviadas desde los
// microservicios; el filtro por defecto solo comprime tipos comprimibles
// (JSON, texto) y respeta un mínimo de 1 KB.
app.use(compression());

// CORS restringido: solo los orígenes configurados (coma-separados).
// En producción hay que definir CORS_ORIGINS con el dominio del frontend.
const ORIGENES_PERMITIDOS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173')
	.split(',')
	.map((origen) => origen.trim())
	.filter(Boolean);

app.use(cors({
	origin: (origin, callback) => callback(null, !origin || ORIGENES_PERMITIDOS.includes(origin)),
	// credentials: true permite que el navegador envíe las cookies HttpOnly
	// (access_token / refresh_token) en peticiones cross-origin y que el
	// servidor responda con Access-Control-Allow-Credentials: true.
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	// 'Cookie' se lista por claridad; las cookies viajan automáticamente con
	// credentials: true y no hacen falta en allowedHeaders.
	allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// El cliente nunca puede dictar su identidad: el gateway la escribe después
// de verificar el JWT. Se eliminan también los alias en español usados antes.
app.use((req, res, next) => {
	delete req.headers['x-user-id'];
	delete req.headers['x-user-role'];
	delete req.headers['x-user-rol'];
	delete req.headers['x-user-identificacion'];
	next();
});

app.get('/', (req, res) => {
	res.json({
		message: 'API Gateway funcionando correctamente'
	});
});

// Agente HTTP con keep-alive para TODAS las llamadas internas al proxy.
// Por defecto http-proxy pone `agent: false`, que crea un socket nuevo para
// cada petición (saludo TCP + TLS completo contra el microservicio de destino).
// Con keep-alive los sockets se reutilizan: baja la latencia de cada
// request autenticada (auth-service se consulta en casi todas) y el costo de
// abrir/cerrar conexiones en Render, que es un plan con CPU limitada.
// Un solo agente para todos los servicios: las claves de socket se guardan
// por host:puerto, así que cada destino mantiene su propio grupo de sockets.
const agenteInterno = new http.Agent({ keepAlive: true, maxSockets: 100 });

const proxyFor = (service, prefix) => createProxyMiddleware({
	target: routes[service],
	changeOrigin: true,
	agent: agenteInterno,
	pathRewrite: (path) => `${prefix}${path}`,
	// El token ya fue validado aquí; se reenvían sus claims para que cada
	// microservicio sepa quién es el usuario sin volver a verificar el JWT.
	on: {
		proxyReq: (proxyReq, req) => {
			const user = req.user;
			if (user) {
				proxyReq.setHeader('x-user-id', String(user.id));
				// Los servicios leen `x-user-role` (en inglés); antes se enviaba
				// `x-user-rol` y el rol llegaba vacío a todos los microservicios.
				proxyReq.setHeader('x-user-role', String(user.rol));
				proxyReq.setHeader('x-user-identificacion', user.identificacion || '');
			}
		},
		// Solo para las escrituras de administrador que el middleware de
		// auditoría marcó: copia la respuesta para registrar qué cambió.
		proxyRes: (proxyRes, req, res) => {
			// El gateway es el único componente público y ya emite los
			// encabezados CORS correctos. No reenviar los wildcard de los
			// microservicios, incompatibles con credentials: true.
			delete proxyRes.headers['access-control-allow-origin'];
			delete proxyRes.headers['access-control-allow-credentials'];
			delete proxyRes.headers['access-control-allow-methods'];
			delete proxyRes.headers['access-control-allow-headers'];
			delete proxyRes.headers['access-control-expose-headers'];
			// Reenviar Set-Cookie (login / refresh establecen cookies
			// HttpOnly) para que el navegador las guarde.
			// http-proxy-middleware no lo hace por defecto.
			const cookies = proxyRes.headers['set-cookie'];
			if (cookies) {
				res.setHeader(
					'set-cookie',
					Array.isArray(cookies) ? cookies : [cookies]
				);
			}
			auditoriaMiddleware.capturarRespuesta(proxyRes, req, res);
		}
	}
});

// Anti fuerza bruta: limita SOLO los intentos de inicio de sesión.
// 5 peticiones por minuto por IP; el resto de endpoints no se ven afectados.
const loginLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 5,
	standardHeaders: true,
	legacyHeaders: false,
	// Un login exitoso no debe consumir el cupo de intentos.
	skipSuccessfulRequests: true,
	message: {
		error: 'Demasiados intentos de inicio de sesión. Vuelve a intentarlo en un minuto.'
	}
});

app.use('/api/auth/login', (req, res, next) =>
	req.method === 'POST' ? loginLimiter(req, res, next) : next()
);

// El correo de recuperación también se limita (3/min por IP) para que nadie
// use el endpoint como bomba de correos contra un buzón ajeno.
const recuperarLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 3,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		error: 'Demasiadas solicitudes de recuperación. Vuelve a intentarlo en un minuto.'
	}
});

app.use('/api/auth/recuperar', (req, res, next) =>
	req.method === 'POST' ? recuperarLimiter(req, res, next) : next()
);

// Registro público: 5 cuentas por hora y IP. Evita crear usuarios en masa.
const registerLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	limit: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		error: 'Demasiados registros desde esta dirección. Intenta más tarde.'
	}
});

app.use('/api/auth/register', (req, res, next) =>
	req.method === 'POST' ? registerLimiter(req, res, next) : next()
);

// Restablecer contraseña: 5 intentos cada 15 minutos por IP.
const restablecerLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		error: 'Demasiados intentos de restablecimiento. Intenta más tarde.'
	}
});

app.use('/api/auth/restablecer', (req, res, next) =>
	req.method === 'POST' ? restablecerLimiter(req, res, next) : next()
);

// Renovación de sesión: el refresh token es opaco y de 32 bytes, así que la
// fuerza bruta es inviable, pero el endpoint es público y se llama en cada
// caducidad del access token. 30/min por IP (solo se cuentan los fallos)
// evita usarlo como punto de entrada para bombardeo o robo de cupo.
const refreshLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 30,
	standardHeaders: true,
	legacyHeaders: false,
	skipSuccessfulRequests: true,
	message: {
		error: 'Demasiadas renovaciones de sesión. Vuelve a intentarlo en un minuto.'
	}
});

app.use('/api/auth/refresh', (req, res, next) =>
	req.method === 'POST' ? refreshLimiter(req, res, next) : next()
);

// Límite general de la API: protege contra ráfagas y scraping.
const apiLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 300,
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => req.method === 'OPTIONS',
	message: {
		error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.'
	}
});

app.use('/api', apiLimiter);

// CSRF por origen: las mutaciones cross-origin deben traer un header Origin
// que coincida con CORS_ORIGINS. Las peticiones de misma origen no traen
// Origin y se dejan pasar. Se aplica a POST/PUT/PATCH/DELETE (incluye
// login, refresh y logout).
function csrfCheck(req, res, next) {
    const mutacion = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    if (!mutacion) return next();
    const origen = req.headers.origin;
    // Sin Origin (misma origen o cliente que no lo envía): no es cross-origin,
    // no hay CSRF que prevenir.
    if (!origen) return next();
    if (!ORIGENES_PERMITIDOS.includes(origen)) {
        return res.status(403).json({ error: 'Origen no permitido' });
    }
    next();
}

// Todo /api/* pasa por verificación de JWT salvo login, register, refresh y
// logout (estos dos son puntos de entrada para renovar o cerrar sesión).
app.use('/api', csrfCheck);
app.use('/api', authMiddleware);

// Comprobación de revocación de sesión: rechaza (401) los access JWT cuyo
// sid esté revocado o expirado en la tabla `sesiones`. Va tras autenticar y
// antes de autorizar, para que una sesión revocada no siga operando.
app.use('/api', sesionMiddleware);

// Auditoría de acciones de administrador (tabla `auditoria`). Va después de
// autenticar, porque necesita saber quién es el actor, y antes de autorizar,
// para que un intento denegado (403) también quede registrado.
app.use('/api', auditoriaMiddleware);

// Autorización por rol. El JWT trae `rol` numérico:
// 1 = Administrador, 2 = Estudiante, 3 = Docente, 4 = Administrativo.
// El gateway corta aquí lo que no corresponde; cada servicio valida además
// la propiedad de sus filas (por ejemplo, una reserva propia).
const GESTORES = [1, 4];
const REGLAS_ROL = [
	{ metodos: ['GET'], patron: /^\/api\/users(\/|$)/, roles: [1, 4] },
	{ metodos: ['POST', 'PUT', 'PATCH', 'DELETE'], patron: /^\/api\/users(\/|$)/, roles: [1] },
	{
		metodos: ['POST', 'PUT', 'PATCH', 'DELETE'],
		patron: /^\/api\/events(\/|$)/,
		roles: [1],
		// Inscribirse/desinscribirse es para cualquier usuario autenticado;
		// el servicio comprueba que sea su propia inscripción.
		excepto: /^\/api\/events\/[^/]+\/inscripciones(\/|$)/
	},
	{ metodos: ['POST', 'PUT', 'PATCH', 'DELETE'], patron: /^\/api\/resources(\/|$)/, roles: [1, 4] },
	{ metodos: ['POST', 'PUT', 'PATCH', 'DELETE'], patron: /^\/api\/academic-info(\/|$)/, roles: [1, 3] },
	{ metodos: ['PUT', 'PATCH', 'DELETE'], patron: /^\/api\/requests(\/|$)/, roles: GESTORES },
	{ metodos: ['POST'], patron: /^\/api\/requests\/[^/]+\/(avance|notas)$/, roles: GESTORES },
	{ metodos: ['PUT', 'PATCH', 'DELETE'], patron: /^\/api\/feedback(\/|$)/, roles: GESTORES }
];

function autorizar(req, res, next) {
	const ruta = req.originalUrl.split('?')[0];
	const regla = REGLAS_ROL.find(
		(item) =>
			item.metodos.includes(req.method) &&
			item.patron.test(ruta) &&
			!(item.excepto && item.excepto.test(ruta))
	);

	if (!regla) return next();

	if (!regla.roles.includes(Number(req.user?.rol))) {
		return res.status(403).json({ error: 'No tienes permisos para esta acción' });
	}
	next();
}

app.use('/api', autorizar);

// ------------------------------------------------------------------
// GET /api/audit — panel "Actividad reciente" del administrador.
//
// Contrato:
//   - Auth: Bearer JWT con rol 1 (Administrador). 401 sin token, 403 si
//     el rol no es administrador, 503 si la base no está disponible.
//   - Query: ?limite=N (opcional; se recorta a 1..200, defecto 50).
//   - 200 -> { data: [{ id, id_usuario, usuario, nombre, accion, entidad,
//     id_entidad, detalle (JSON parseado), fecha }] } de más reciente a
//     más antigua.
//
// Vive en el gateway (y no en un microservicio) porque el gateway es el
// único componente que ya escribe `auditoria` y su pool está en
// auditoria.js: la tabla no tiene otro dueño natural.
// ------------------------------------------------------------------
app.get('/api/audit', (req, res) => {
	if (Number(req.user?.rol) !== 1) {
		return res.status(403).json({ error: 'Solo el administrador puede consultar la actividad' });
	}

	auditoriaMiddleware
		.consultarActividad(req.query.limite)
		.then((data) => res.json({ data }))
		.catch((error) => {
			console.warn(`[auditoria] no se pudo leer la actividad: ${error.message}`);
			res.status(503).json({ error: 'No se pudo leer la actividad. Intenta más tarde.' });
		});
});

// Socket.IO: el upgrade viaja al notifications-service. La autenticación del
// handshake la hace ese servicio con el JWT que envía el cliente en `auth`.
// Socket.IO: el upgrade viaja al notifications-service. Se usa pathFilter
// (no un mount de Express) para conservar /socket.io tanto en el polling
// como en el upgrade WebSocket.
const socketProxy = createProxyMiddleware({
	pathFilter: (path) => path.startsWith('/socket.io'),
	target: routes.notifications,
	changeOrigin: true,
	ws: true
});
app.use(socketProxy);
// http-proxy-middleware se suscribe al evento `upgrade` recién con la primera
// petición HTTP. Un cliente que abre solo WebSocket nunca lo dispararía, así
// que lo enganchamos explícitamente en server.js.
app.locals.socketProxy = socketProxy;

// Tras una escritura exitosa en una tabla indexada, avisa al search-service
// para que reindexe ese índice. Un solo punto de cambio para los seis
// servicios, y no bloquea la respuesta (ver middlewares/reindexado.js).
app.use('/api', reindexadoMiddleware);

app.use('/api/auth', proxyFor('auth', '/api/auth'));
app.use('/api/users', proxyFor('users', '/api/users'));
app.use('/api/events', proxyFor('events', '/api/events'));
app.use('/api/reservations', proxyFor('reservations', '/api/reservations'));
app.use('/api/notifications', proxyFor('notifications', '/api/notifications'));
app.use('/api/requests', proxyFor('requests', '/api/requests'));
app.use('/api/resources', proxyFor('resources', '/api/resources'));
app.use('/api/feedback', proxyFor('feedback', '/api/feedback'));
app.use('/api/academic-info', proxyFor('academic-info', '/api/academic-info'));
app.use('/api/configuration', proxyFor('configuration', '/api/configuration'));
app.use('/api/search', proxyFor('search', '/api/search'));

module.exports = app;
