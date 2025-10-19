const express = require('express');
const reliabilityController = require('../controllers/RetabilityController');
const authMiddleware = require('../middleware/AuthMiddleware');
const kycVerification = require('../middleware/KycVerification');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', reliabilityController.getMyReliability);
router.put('/me', reliabilityController.updateMyReliability);
router.post('/me/events', reliabilityController.recordEvent);
router.get('/top', kycVerification, reliabilityController.getTopReliableUsers);

module.exports = router;