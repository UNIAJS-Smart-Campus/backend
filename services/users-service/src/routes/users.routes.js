const router = require('express').Router();

router.get('/', (req, res) => {
    res.status(501).json({ error: 'No implementado aún' });
});

router.post('/', (req, res) => {
    res.status(501).json({ error: 'No implementado aún' });
});

router.put('/:id', (req, res) => {
    res.status(501).json({ error: 'No implementado aún' });
});

router.delete('/:id', (req, res) => {
    res.status(501).json({ error: 'No implementado aún' });
});

module.exports = router;
