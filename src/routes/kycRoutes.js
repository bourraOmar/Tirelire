const express = require('express');
const kycController = require('../controllers/KycController');
const authMiddleware = require('../middleware/AuthMiddleware');
const kycVerification = require('../middleware/KycVerification');

const router = express.Router();

router.use(authMiddleware);

router.post('/', kycController.submitKYC);
router.get('/me', kycController.getMyKYC);
router.get('/:id', kycVerification, kycController.getKycById);
// router.post('/:id/verify-ai', kycController.verifyKYCByAI);

module.exports = router;