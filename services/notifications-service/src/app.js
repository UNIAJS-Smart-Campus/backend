const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../../.env') });

const app = express();

app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Notifications Service funcionando correctamente'
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'notifications-service', timestamp: new Date().toISOString() });
});

app.use('/api/notifications', require('./routes/notifications.routes'));

app.use(require('./middlewares/errorHandler'));

module.exports = app;