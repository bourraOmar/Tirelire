const express = require('express');
const paymentController = require('../controllers/PaymentController');
const authMiddleware = require('../middleware/AuthMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/intent', paymentController.createPaymentIntent);
router.post('/intent/:paymentIntentId/sync', paymentController.syncPayment);
router.get('/', paymentController.getMyPayments);
router.get('/:paymentId', paymentController.getPaymentById);
router.post('/:paymentId/cancel', paymentController.cancelPayment);

module.exports = router;