const router = require('express').Router();
const requireRoles = require('../middlewares/roles');
const { getAll, getOne, create, update, remove } = require('../controllers/users.controller');

// Administrar usuarios es exclusivo del Administrador. La lectura también
// la usa el Administrativo para asignar responsables (solicitudes/PQRS).
router.get('/', requireRoles('1', '4'), getAll);
router.get('/:id', requireRoles('1', '4'), getOne);
router.post('/', requireRoles('1'), create);
router.put('/:id', requireRoles('1'), update);
router.delete('/:id', requireRoles('1'), remove);

module.exports = router;
