const express = require('express');
const messageController = require('../controllers/MessageController');
const authMiddleware = require('../middleware/AuthMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/group/:groupId', messageController.createMessage);
router.get('/group/:groupId', messageController.getGroupMessages);
router.patch('/:messageId/read', messageController.markAsRead);
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;