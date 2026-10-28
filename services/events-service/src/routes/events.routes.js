const router = require('express').Router();
const requireActor = require('../middlewares/actor');
const requireAdmin = require('../middlewares/admin');
const { getAll, getOne, create, update, remove, register, unregister } = require('../controllers/events.controller');

router.use(requireActor);

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', requireAdmin, create);
router.put('/:id', requireAdmin, update);
router.delete('/:id', requireAdmin, remove);

router.post('/:id/register', register);
router.delete('/:id/register', unregister);

module.exports = router;
