const router = require('express').Router();
const requireActor = require('../middlewares/actor');
const { getAll, getOne, getOcupados, create, update, remove } = require('../controllers/reservations.controller');

router.use(requireActor);

router.get('/', getAll);
// Debe declararse antes de /:id para que "ocupados" no se interprete como un id.
router.get('/ocupados', getOcupados);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
