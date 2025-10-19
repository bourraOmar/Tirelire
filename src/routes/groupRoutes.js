const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/AuthMiddleware');
const kycVerified = require('../middleware/KycVerified');
const groupController = require('../controllers/GroupController');

router.post('/', authMiddleware, kycVerified, groupController.createGroup);

router.post('/:groupId/join', authMiddleware, kycVerified, groupController.joinGroup);

router.get('/my', authMiddleware, groupController.getMyGroups);

router.get('/:groupId', authMiddleware, groupController.getGroupById);

module.exports = router;