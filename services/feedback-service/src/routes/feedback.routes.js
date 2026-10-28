const router = require('express').Router();
const requireActor = require('../middlewares/actor');
const { getAll, getOne, create, update, remove } = require('../controllers/feedback.controller');

router.use(requireActor);

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
