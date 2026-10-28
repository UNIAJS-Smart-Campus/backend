const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const routes = require('./config/routes');
const verifyToken = require('./middlewares/auth');

const app = express();

app.use(cors());

app.get('/', (req, res) => {
	res.json({
		message: 'API Gateway funcionando correctamente'
	});
});

// Rutas públicas: login, registro y el webhook interno (protegido por secreto propio).
const PUBLIC_API_PATHS = new Set([
	'/api/auth/login',
	'/api/auth/register',
	'/api/notifications/webhook'
]);

function limpiarHeadersDeActor(req) {
	// Evita que un cliente falsifique la identidad que consumen los servicios.
	delete req.headers['x-user-id'];
	delete req.headers['x-user-role'];
	delete req.headers['x-user-identificacion'];
}

app.use('/api', (req, res, next) => {
	const pathname = req.originalUrl.split('?')[0].replace(/\/+$/, '');

	if (PUBLIC_API_PATHS.has(pathname)) {
		limpiarHeadersDeActor(req);
		return next();
	}

	return verifyToken(req, res, next);
});

// La búsqueda global puede devolver datos de usuarios; por ahora solo administradores.
app.use('/api/search', (req, res, next) => {
	if (req.user?.tipo_usuario !== 'Administrador') {
		return res.status(403).json({ error: 'Solo administradores pueden usar la búsqueda global' });
	}
	next();
});

// Socket.IO (notificaciones en tiempo real): HTTP polling + upgrade a WebSocket.
// Express recorta el prefijo del mount, por eso se restaura en pathRewrite.
app.use('/socket.io', createProxyMiddleware({
	target: routes.notifications,
	changeOrigin: true,
	pathRewrite: (path) => `/socket.io${path.startsWith('/') ? path : `/${path}`}`
}));

const proxyFor = (service, prefix) => createProxyMiddleware({
	target: routes[service],
	changeOrigin: true,
	pathRewrite: (path) => `${prefix}${path}`
});

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
