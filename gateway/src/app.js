const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const routes = require('./config/routes');
const authMiddleware = require('./middlewares/auth');

const app = express();
app.disable('x-powered-by');

app.use(helmet());

const corsOptions = {
	origin: process.env.FRONTEND_URL || 'http://localhost:5173',
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Rate limit global antes de llegar a cualquier servicio.
// 100 req/min por IP era demasiado bajo para una SPA que carga varias listas
// por pantalla y refresca por WebSocket: el usuario recibía 429 a los pocos
// clics. 600/min mantiene la protección sin bloquear el uso normal.
const apiLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 600,
	message: { error: 'Demasiadas peticiones. Intente de nuevo en un minuto.' },
	standardHeaders: true,
	legacyHeaders: false
});
app.use(apiLimiter);

// Límite más estricto para evitar fuerza bruta en autenticación.
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	message: { error: 'Demasiados intentos. Espere unos minutos antes de reintentar.' },
	standardHeaders: true,
	legacyHeaders: false
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// WebSocket (Socket.IO) hacia notifications-service. Se monta antes de la
// autenticación HTTP porque el handshake trae el JWT en `auth.token`.
app.use('/socket.io', createProxyMiddleware({
	target: new URL(routes.notifications).origin,
	ws: true,
	changeOrigin: true
}));

// Autenticación en el borde: valida el JWT y propaga x-user-* a los servicios.
app.use(authMiddleware);

// PROXY - antes de express.json() para no consumir el body de las peticiones.
const proxyFor = (service) => createProxyMiddleware({
	target: routes[service],
	changeOrigin: true,
	pathRewrite: { '^/api/auth': '/', '^/api/users': '/', '^/api/events': '/', '^/api/reservations': '/', '^/api/notifications': '/', '^/api/requests': '/', '^/api/resources': '/', '^/api/feedback': '/', '^/api/academic-info': '/', '^/api/configuration': '/', '^/api/search': '/' },
	onProxyReq: (proxyReq, req) => {
		console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${routes[service]}${req.path}`);
	},
	onProxyRes: (proxyRes, req) => {
		console.log(`[PROXY RES] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`);
	},
	onError: (err, req, res) => {
		console.error('[PROXY ERROR]', err.message);
		if (!res.headersSent) {
			res.status(502).json({ error: 'Bad Gateway' });
		}
	}
});

app.use('/api/auth', proxyFor('auth'));
app.use('/api/users', proxyFor('users'));
app.use('/api/events', proxyFor('events'));
app.use('/api/reservations', proxyFor('reservations'));
app.use('/api/notifications', proxyFor('notifications'));
app.patch('/api/notifications/:id/read', proxyFor('notifications'));
app.patch('/api/notifications/read-all', proxyFor('notifications'));
app.use('/api/requests', proxyFor('requests'));
app.use('/api/resources', proxyFor('resources'));
app.use('/api/feedback', proxyFor('feedback'));
app.use('/api/academic-info', proxyFor('academic-info'));
app.use('/api/configuration', proxyFor('configuration'));
app.use('/api/search', proxyFor('search'));

app.use(express.json());

app.get('/', (req, res) => {
	res.json({
		message: 'API Gateway funcionando correctamente'
	});
});

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', service: 'gateway', timestamp: new Date().toISOString() });
});

module.exports = app;
