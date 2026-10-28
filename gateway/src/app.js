const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const routes = require('./config/routes');

const app = express();

app.use(helmet());

const corsOptions = {
	origin: process.env.FRONTEND_URL || 'http://localhost:5173',
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// PROXY FIRST - antes de express.json()
const proxyFor = (service) => createProxyMiddleware({
	target: routes[service],
	changeOrigin: true,
	pathRewrite: { '^/api/auth': '/', '^/api/users': '/', '^/api/events': '/', '^/api/reservations': '/', '^/api/notifications': '/', '^/api/requests': '/', '^/api/resources': '/', '^/api/feedback': '/', '^/api/academic-info': '/', '^/api/configuration': '/', '^/api/search': '/' },
	onProxyReq: (proxyReq, req, res) => {
		console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${routes[service]}${req.path}`);
	},
	onProxyRes: (proxyRes, req, res) => {
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
app.use('/api/requests', proxyFor('requests'));
app.use('/api/resources', proxyFor('resources'));
app.use('/api/feedback', proxyFor('feedback'));
app.use('/api/academic-info', proxyFor('academic-info'));
app.use('/api/configuration', proxyFor('configuration'));
app.use('/api/search', proxyFor('search'));

// LUEGO body parser y rate limit
app.use(express.json());

const apiLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 100,
	message: { error: 'Demasiadas peticiones. Intente de nuevo en un minuto.' },
	standardHeaders: true,
	legacyHeaders: false
});

app.use(cors({
	origin: process.env.FRONTEND_URL || 'http://localhost:5173',
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(helmet());

app.get('/', (req, res) => {
	res.json({
		message: 'API Gateway funcionando correctamente'
	});
});

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', service: 'gateway', timestamp: new Date().toISOString() });
});

module.exports = app;