const router = require('express').Router();
const { getAll, getOne, getByUserAndSection, create, update, remove } = require('../controllers/configuracion.controller');

router.get('/', getAll);
router.get('/:id', getOne);
router.get('/usuario/:id_usuario/seccion/:seccion', getByUserAndSection);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
