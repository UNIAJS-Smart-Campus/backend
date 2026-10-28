const app = require('./app');
const PORT = process.env.RESERVATIONS_SERVICE_PORT || 3004;

app.listen(PORT, () => {
    console.log(`Reservations Service corriendo en http://localhost:${PORT}`);
});
