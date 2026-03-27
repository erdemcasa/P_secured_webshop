const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/AdminController');

router.get('/users', controller.getUsers);

module.exports = router;
