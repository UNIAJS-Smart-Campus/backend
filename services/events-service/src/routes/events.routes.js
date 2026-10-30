const router = require('express').Router();
const requireRoles = require('../middlewares/roles');
const {
    getAll, getOne, create, update, remove, listarInscripciones, inscribir, desinscribir
} = require('../controllers/events.controller');

// Consultar actividades es para toda la comunidad; publicarlas/editar es
// exclusivo del Administrador.
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', requireRoles('1'), create);
router.put('/:id', requireRoles('1'), update);
router.delete('/:id', requireRoles('1'), remove);

// Inscripciones: cualquier autenticado, el controlador valida que sea suya.
router.get('/:id/inscripciones', listarInscripciones);
router.post('/:id/inscripciones', inscribir);
router.delete('/:id/inscripciones/:idUsuario', desinscribir);

module.exports = router;
