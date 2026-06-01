const express = require('express');
const router = express.Router();
const { login, getMe, changePassword, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateLogin } = require('../middleware/validationMiddleware');

router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

module.exports = router;