const app = require('./app');
const PORT = process.env.EVENTS_SERVICE_PORT || 3003;

app.listen(PORT, () => {
    console.log(`Events Service corriendo en http://localhost:${PORT}`);
});
