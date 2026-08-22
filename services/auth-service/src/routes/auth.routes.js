const router = require('express').Router();

router.post('/login', (req, res) => {
    res.status(501).json({ error: 'No implementado aún' });
});

router.post('/register', (req, res) => {
    res.status(501).json({ error: 'No implementado aún' });
});

router.get('/me', (req, res) => {
    res.status(501).json({ error: 'No implementado aún' });
});

module.exports = router;
