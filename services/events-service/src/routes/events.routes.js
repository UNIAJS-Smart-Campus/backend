const router = require('express').Router();
const {
    getAll, getOne, create, update, remove, listarInscripciones, inscribir, desinscribir
} = require('../controllers/events.controller');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.get('/:id/inscripciones', listarInscripciones);
router.post('/:id/inscripciones', inscribir);
router.delete('/:id/inscripciones/:idUsuario', desinscribir);

module.exports = router;
