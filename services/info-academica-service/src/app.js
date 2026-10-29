const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../../.env') });

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Info Académica Service funcionando correctamente'
    });
});

app.use('/api/info-academica', require('./routes/info-academica.routes'));

app.use(require('./middlewares/errorHandler'));

module.exports = app;
