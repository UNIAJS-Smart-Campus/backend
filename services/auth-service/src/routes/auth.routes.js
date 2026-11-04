const router = require('express').Router();
const { login, register, recuperar, restablecer, me, accesos, refresh, logout } = require('../controllers/auth.controller');
const verifyToken = require('../middlewares/auth');

router.post('/login', login);
router.post('/register', register);
router.post('/recuperar', recuperar);
router.post('/restablecer', restablecer);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', verifyToken, me);
router.get('/accesos', verifyToken, accesos);

module.exports = router;
