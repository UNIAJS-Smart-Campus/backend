const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const routes = require('./config/routes');
const authMiddleware = require('./middlewares/auth');
const reindexadoMiddleware = require('./middlewares/reindexado');

const app = express();

// Detrás de nginx/Vercel/el proxy de Docker, la IP real llega en
// X-Forwarded-For. Sin esto, el rate limit contaría a todos como la misma IP.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// CORS restringido: solo los orígenes configurados (coma-separados).
// En producción hay que definir CORS_ORIGINS con el dominio del frontend.
const ORIGENES_PERMITIDOS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173')
	.split(',')
	.map((origen) => origen.trim())
	.filter(Boolean);

app.use(cors({
	origin: (origin, callback) => callback(null, !origin || ORIGENES_PERMITIDOS.includes(origin)),
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization']
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

const proxyFor = (service, prefix) => createProxyMiddleware({
	target: routes[service],
	changeOrigin: true,
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

// Todo /api/* pasa por verificación de JWT salvo login y register.
app.use('/api', authMiddleware);

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
