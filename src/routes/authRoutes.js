const express = require('express');
const { register, login, getProfile, updateProfile, getUserInfo } = require('../controllers/AuthController');
const authMiddleware = require('../middleware/AuthMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.get('/info', authMiddleware, getUserInfo);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;