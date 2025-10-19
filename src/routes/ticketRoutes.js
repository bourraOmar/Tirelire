const express = require('express');
const ticketController = require('../controllers/TicketController');
const authMiddleware = require('../middleware/AuthMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', ticketController.createTicket);
router.get('/', ticketController.listTickets);
router.get('/:ticketId', ticketController.getTicket);
router.post('/:ticketId/responses', ticketController.addResponse);
router.patch('/:ticketId/status', ticketController.updateStatus);

module.exports = router;