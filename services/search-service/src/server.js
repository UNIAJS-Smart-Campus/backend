const app = require('./app');
const { run: indexar } = require('./services/indexer');

const PORT = process.env.SEARCH_SERVICE_PORT || 3011;

app.listen(PORT, () => {
    console.log(`Search Service corriendo en http://localhost:${PORT}`);

    // Mantener los índices al día al arrancar. Si Elasticsearch aún no está
    // listo, el servicio sigue respondiendo y el error queda en el log.
    indexar({ close: false })
        .then((ok) => {
            if (ok) console.log('Índices de búsqueda listos');
        })
        .catch((error) => {
            console.error('No se pudo indexar al iniciar:', error.message);
        });
});
