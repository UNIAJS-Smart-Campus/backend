const app = require('./app');
const PORT = process.env.PQRS_SERVICE_PORT || 3008;

app.listen(PORT, () => {
    console.log(`PQRS Service corriendo en http://localhost:${PORT}`);
});
