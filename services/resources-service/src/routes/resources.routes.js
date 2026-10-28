const router = require('express').Router();
const requireActor = require('../middlewares/actor');
const requireGestor = require('../middlewares/gestor');
const { getAll, getOne, create, update, remove } = require('../controllers/resources.controller');

router.use(requireActor);

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', requireGestor, create);
router.put('/:id', requireGestor, update);
router.delete('/:id', requireGestor, remove);

module.exports = router;
