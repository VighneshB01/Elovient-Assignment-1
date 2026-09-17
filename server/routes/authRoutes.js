const express = require('express');
const router = express.Router();
const { signup, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/register', signup); // Task 1 alias — same handler, same behavior
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
