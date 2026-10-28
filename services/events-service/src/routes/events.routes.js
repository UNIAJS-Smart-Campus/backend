const router = require('express').Router();
const { getAll, getOne, create, update, remove, register, unregister } = require('../controllers/events.controller');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.post('/:id/register', register);
router.delete('/:id/register', unregister);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
