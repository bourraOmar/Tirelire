const express = require('express');
const turnController = require('../controllers/TurnController');
const authMiddleware = require('../middleware/AuthMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/group/:groupId', turnController.scheduleTurn);
router.get('/group/:groupId', turnController.listTurns);
router.patch('/:turnId/complete', turnController.markTurnCompleted);
router.delete('/:turnId', turnController.deleteTurn);

module.exports = router;