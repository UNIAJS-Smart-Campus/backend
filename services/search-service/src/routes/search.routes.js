const express = require('express');
const router = express.Router();
const controller = require('../controllers/search.controller');
const requireActor = require('../middlewares/actor');

router.use(requireActor);

router.get('/', controller.searchAll);
router.get('/suggest', controller.suggest);
router.get('/indices', controller.getIndices);
router.get('/:index', controller.searchByIndex);

module.exports = router;
