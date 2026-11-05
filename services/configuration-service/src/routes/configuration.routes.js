const router = require('express').Router();
const {
    getAll,
    getOne,
    getByUserAndSection,
    create,
    update,
    remove,
    getRolePermissions,
    updateRolePermissions
} = require('../controllers/configuration.controller');

router.get('/', getAll);
router.get('/roles-permisos', getRolePermissions);
router.put('/roles-permisos', updateRolePermissions);
router.get('/:id', getOne);
router.get('/usuario/:id_usuario/seccion/:seccion', getByUserAndSection);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
