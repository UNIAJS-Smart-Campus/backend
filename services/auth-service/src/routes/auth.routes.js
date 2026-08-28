const router = require('express').Router();
const { login, register, me } = require('../controllers/auth.controller');
const verifyToken = require('../middlewares/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/me', verifyToken, me);

module.exports = router;
