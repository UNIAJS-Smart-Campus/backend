const http = require('http');
const httpProxy = require('http-proxy');
const app = require('./app');
const routes = require('./config/routes');

const PORT = process.env.GATEWAY_PORT || 3000;

const server = http.createServer(app);

// Proxy de WebSockets para Socket.IO (notificaciones en tiempo real).
const realtimeProxy = httpProxy.createProxyServer({
	target: routes.notifications,
	ws: true,
	changeOrigin: true,
	xfwd: true
});

realtimeProxy.on('error', (error, req, socket) => {
	console.error(`[ws-proxy] ${error.message}`);
	if (socket && typeof socket.destroy === 'function') {
		socket.destroy();
	}
});

server.on('upgrade', (req, socket, head) => {
	if (!req.url.startsWith('/socket.io')) {
		socket.destroy();
		return;
	}
	realtimeProxy.ws(req, socket, head);
});

server.listen(PORT, () => {
	console.log(`Gateway corriendo en http://localhost:${PORT}`);
});
