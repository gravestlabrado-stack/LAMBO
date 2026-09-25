const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public auth endpoints
router.post('/register', register);
router.post('/login', login);

// Private profile endpoint
router.get('/me', protect, getMe);

module.exports = router;
