const app = require('./app');

const PORT = process.env.RESOURCES_SERVICE_PORT || 3007;

app.listen(PORT, () => {
    console.log(`Resources Service corriendo en http://localhost:${PORT}`);
});