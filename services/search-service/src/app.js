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
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servicio de búsqueda'
    });
});

module.exports = app;
