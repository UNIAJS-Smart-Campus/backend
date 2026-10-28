const http = require('http');
const app = require('./app');
const { initRealtime } = require('./realtime');

const PORT = process.env.NOTIFICATIONS_SERVICE_PORT || 3005;

const server = http.createServer(app);
initRealtime(server);

server.listen(PORT, () => {
    console.log(`Notifications Service corriendo en http://localhost:${PORT}`);
});
