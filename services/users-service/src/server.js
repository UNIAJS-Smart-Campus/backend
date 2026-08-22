const app = require('./app');
const PORT = process.env.USERS_SERVICE_PORT || 3002;

app.listen(PORT, () => {
    console.log(`Users Service corriendo en http://localhost:${PORT}`);
});
