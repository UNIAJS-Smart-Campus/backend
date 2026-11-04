const express = require('express');
const cors = require('cors');
const path = require('path');

// Cargar .env desde la raíz del proyecto
require('dotenv').config({ path: path.resolve(__dirname, '../../../../../.env') });
const app = express();

const ORIGENES_PERMITIDOS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) =>
        callback(null, !origin || ORIGENES_PERMITIDOS.includes(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Auth Service funcionando correctamente'
    });
});

app.use('/api/auth', require('./routes/auth.routes'));

app.use(require('./middlewares/errorHandler'));

module.exports = app;