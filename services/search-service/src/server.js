const app = require('./app');

const PORT = process.env.SEARCH_SERVICE_PORT || 3011;

// Reindexado opcional por intervalo.
//
// Por defecto DESACTIVADO: el servicio arranca reindexando (una vez) y luego
// queda quieto, para no castigar MySQL/Elasticsearch en desarrollo. Poniendo
// SEARCH_REINDEX_INTERVAL_MS (p. ej. 300000 = 5 min) el índice se mantiene
// al día solo, que es lo que evita "se me olvidó reindexar".
const INTERVALO_REINDEX = Number(process.env.SEARCH_REINDEX_INTERVAL_MS) || 0;

app.listen(PORT, () => {
    console.log(`Search Service corriendo en http://localhost:${PORT}`);

    if (INTERVALO_REINDEX > 0) {
        const { reindexar } = require('./services/indexer');
        console.log(
            `Reindexado automático cada ${INTERVALO_REINDEX} ms activado`
        );
        setInterval(() => {
            reindexar().catch((error) => {
                // Un fallo puntual no debe tumbar el servicio.
                console.error('Reindexado automático falló:', error.message);
            });
        }, INTERVALO_REINDEX).unref();
    }
});
