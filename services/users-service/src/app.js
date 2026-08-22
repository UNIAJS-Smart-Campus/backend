const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Auth Service funcionando correctamente'
    });
});

app.use('/api/users', require('./routes/users.routes'));

app.use(require('./middlewares/errorHandler'));

module.exports = app;
