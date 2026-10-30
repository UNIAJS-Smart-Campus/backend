const http = require('http');
const app = require('./app');

const PORT = process.env.GATEWAY_PORT || 3000;

// Servidor HTTP explícito: http-proxy-middleware necesita el evento `upgrade`
// para reenviar WebSockets (/socket.io) al notifications-service.
const server = http.createServer(app);

// El proxy de Socket.IO se suscribe al `upgrade` al primer HTTP; para los
// clientes que abren WebSocket directamente hay que engancharlo aquí.
const socketProxy = app.locals.socketProxy;
if (socketProxy?.upgrade) {
	server.on('upgrade', socketProxy.upgrade);
}

server.listen(PORT, () => {
	console.log(`Gateway corriendo en http://localhost:${PORT}`);
});
