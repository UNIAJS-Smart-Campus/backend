const router = require('express').Router();
const pool = require('../config/database');

router.get('/', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM recursos');

        res.json(rows);
    } catch (error) {
        next(error);
    }
});

module.exports = router;