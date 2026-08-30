const app = require('./app');
const PORT = process.env.INFO_ACADEMICA_SERVICE_PORT || 3009;

app.listen(PORT, () => {
    console.log(`Info Académica Service corriendo en http://localhost:${PORT}`);
});
