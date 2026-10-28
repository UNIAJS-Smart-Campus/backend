const router = require('express').Router();
const requireActor = require('../middlewares/actor');
const {
    getAll,
    getOne,
    create,
    update,
    remove,
    markRead,
    markAllRead,
    webhook
} = require('../controllers/notifications.controller');

// Webhook interno: se autentica con secreto compartido, sin JWT de usuario.
router.post('/webhook', webhook);

router.use(requireActor);

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);

module.exports = router;
