const app = require('./app');
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

app.listen(PORT, () => {
    console.log(`Auth Service corriendo en http://localhost:${PORT}`);
});