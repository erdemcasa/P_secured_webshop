const express = require('express');
const router = express.Router();
const controller = require('../controllers/AuthController');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, controller.login);
router.post('/register', controller.register);

router.get('/me', controller.me);
router.get('/logout', controller.logout);
router.post('/refresh', controller.refreshToken);

module.exports = router;
