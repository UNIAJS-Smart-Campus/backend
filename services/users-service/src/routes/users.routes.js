const router = require('express').Router();
const requireActor = require('../middlewares/actor');
const requireAdmin = require('../middlewares/admin');
const { getAll, getOne, create, update, remove } = require('../controllers/users.controller');

router.use(requireActor);

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', requireAdmin, create);
router.put('/:id', requireAdmin, update);
router.delete('/:id', requireAdmin, remove);

module.exports = router;
