const express = require('express');
const router = express.Router();
const controller = require('../controllers/search.controller');

router.get('/', controller.searchAll);
router.get('/suggest', controller.suggest);
router.get('/indices', controller.getIndices);
router.get('/:index', controller.searchByIndex);

module.exports = router;
