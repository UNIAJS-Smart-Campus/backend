const router = require('express').Router();
const requireRoles = require('../middlewares/roles');
const { getAll, getOne, create, update, remove } = require('../controllers/academic-info.controller');

// Publicar información académica: Administrador y Docente.
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', requireRoles('1', '3'), create);
router.put('/:id', requireRoles('1', '3'), update);
router.delete('/:id', requireRoles('1', '3'), remove);

module.exports = router;
