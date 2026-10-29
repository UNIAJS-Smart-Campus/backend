const router = require('express').Router();
const {
    getAll, getOne, create, update, advance, addNota, remove
} = require('../controllers/requests.controller');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.post('/:id/avance', advance);
router.post('/:id/notas', addNota);
router.delete('/:id', remove);

module.exports = router;
