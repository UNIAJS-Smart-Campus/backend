const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../../.env') });

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Reservations Service funcionando correctamente'
    });
});

app.use('/api/reservations', require('./routes/reservations.routes'));

app.use(require('./middlewares/errorHandler'));

module.exports = app;
