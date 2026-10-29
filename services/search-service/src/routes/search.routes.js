const express = require('express');
const router = express.Router();
const controller = require('../controllers/search.controller');

router.get('/', controller.searchAll);
router.get('/suggest', controller.suggest);
router.get('/indices', controller.getIndices);
// Debe ir antes de '/:index' o esa ruta captura "reindex" como índice.
router.post('/reindex', controller.reindex);
router.get('/:index', controller.searchByIndex);

module.exports = router;
