const app = require('./app');

const PORT = process.env.SEARCH_SERVICE_PORT || 3011;

app.listen(PORT, () => {
    console.log(`Search Service corriendo en http://localhost:${PORT}`);
});
