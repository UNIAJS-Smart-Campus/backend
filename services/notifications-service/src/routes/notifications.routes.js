const router = require('express').Router();
const { getAll, getOne, create, update, remove, markRead, markAllRead, webhook } = require('../controllers/notifications.controller');
const requireActor = require('../middlewares/actor');

// Público para los servicios internos: se protege con x-webhook-secret.
router.post('/webhook', webhook);

// A partir de aquí se exige identidad validada por el gateway.
router.use(requireActor);

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

module.exports = router;
