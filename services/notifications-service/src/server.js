const app = require('./app');
const PORT = process.env.NOTIFICATIONS_SERVICE_PORT || 3005;

app.listen(PORT, () => {
    console.log(`Notifications Service corriendo en http://localhost:${PORT}`);
});
