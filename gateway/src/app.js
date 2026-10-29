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

app.use(cors());

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
				proxyReq.setHeader('x-user-rol', String(user.rol));
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

// Todo /api/* pasa por verificación de JWT salvo login y register.
app.use('/api', authMiddleware);

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
