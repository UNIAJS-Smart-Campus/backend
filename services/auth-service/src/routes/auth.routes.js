const router = require('express').Router();
const { login, register, recuperar, restablecer, me } = require('../controllers/auth.controller');
const verifyToken = require('../middlewares/auth');

router.post('/login', login);
router.post('/register', register);
router.post('/recuperar', recuperar);
router.post('/restablecer', restablecer);
router.get('/me', verifyToken, me);

module.exports = router;
