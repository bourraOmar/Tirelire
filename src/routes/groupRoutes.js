const express = require('express');
const groupController = require('../controllers/GroupController');
const authMiddleware = require('../middleware/AuthMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', groupController.createGroup);
router.get('/', groupController.getMyGroups);
router.get('/:groupId', groupController.getGroupById);
router.put('/:groupId', groupController.updateGroup);
router.delete('/:groupId', groupController.deleteGroup);
router.post('/:groupId/members', groupController.addMember);
router.delete('/:groupId/members/:memberId', groupController.removeMember);

module.exports = router;