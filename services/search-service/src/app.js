const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../../.env') });

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Search Service funcionando correctamente',
        elasticsearch: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200'
    });
});

app.use('/api/search', require('./routes/search.routes'));

app.use((err, req, res, next) => {
    console.error('Search Service Error:', err.message);
    const status = err.status || 500;
    // No filtrar detalles internos de Elasticsearch/MySQL al cliente.
    res.status(status).json({
        error: status >= 500
            ? 'Error interno del servicio de busqueda'
            : err.message || 'Solicitud invalida'
    });
});

module.exports = app;
