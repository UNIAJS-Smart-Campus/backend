const router = require('express').Router();
const requireRoles = require('../middlewares/roles');
const { getAll, getOne, create, update, remove } = require('../controllers/resources.controller');

// El catálogo lo consulta cualquier autenticado; administrarlo corresponde
// al Administrador y al Administrativo.
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', requireRoles('1', '4'), create);
router.put('/:id', requireRoles('1', '4'), update);
router.delete('/:id', requireRoles('1', '4'), remove);

module.exports = router;
