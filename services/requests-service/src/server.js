const app = require('./app');

const PORT = process.env.REQUESTS_SERVICE_PORT || 3006;

app.listen(PORT, () => {
    console.log(`Requests Service corriendo en http://localhost:${PORT}`);
});