const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../../.env') });

const requireActor = require('./middlewares/actor');

const app = express();

app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Events Service funcionando correctamente'
    });
});

app.use('/api/events', requireActor, require('./routes/events.routes'));

app.use(require('./middlewares/errorHandler'));

module.exports = app;