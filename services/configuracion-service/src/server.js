const app = require('./app');
const PORT = process.env.CONFIGURACION_SERVICE_PORT || 3010;

app.listen(PORT, () => {
    console.log(`Configuración Service corriendo en http://localhost:${PORT}`);
});
