const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = require('./app');

const PORT = process.env.GATEWAY_PORT || 3000;
const NOTIF_ORIGIN = 'http://notifications-service:3005';

const server = http.createServer(app);
const wsProxy = createProxyMiddleware({
    target: NOTIF_ORIGIN,
    ws: true,
    changeOrigin: true,
    on: {
        proxyReqWs: (proxyReq, req, socket, options, head) => {
            console.log('[PROXY WS REQ]', req.url);
        },
        error: (err, req, res) => {
            console.error('[PROXY WS ERROR]', err.message);
        }
    }
});

server.on('upgrade', (req, socket, head) => {
    console.log('[WS UPGRADE]', req.url);
    try {
        wsProxy.upgrade(req, socket, head);
    } catch (e) {
        console.error('[WS ERROR]', e);
        socket.destroy();
    }
});

socketErrorHandler = (err) => console.error('[SOCKET ERROR]', err.message);
server.on('error', socketErrorHandler);

server.listen(PORT, () => {
    console.log(`Gateway corriendo en http://localhost:${PORT}`);
});
