const ticketService = require('../services/TicketService');

const handleError = (res, error) => {
    const statusCode = error.statusCode || 500;
    const response = { message: error.statusCode ? error.message : 'Server error' };

    if (!error.statusCode) {
        response.error = error.message;
    }

    return res.status(statusCode).json(response);
};

exports.createTicket = async (req, res) => {
    try {
        const ticket = await ticketService.createTicket({
            userId: req.user.id,
            subject: req.body.subject,
            description: req.body.description,
            priority: req.body.priority,
        });

        res.status(201).json({ message: 'Ticket created successfully', ticket });
    } catch (error) {
        handleError(res, error);
    }
};

exports.listTickets = async (req, res) => {
    try {
        const tickets = await ticketService.listTickets({
            userId: req.user.id,
            role: req.user.role,
            status: req.query.status,
        });

        res.status(200).json({ tickets });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getTicket = async (req, res) => {
    try {
        const ticket = await ticketService.getTicketById({
            ticketId: req.params.ticketId,
            userId: req.user.id,
            role: req.user.role,
        });

        res.status(200).json({ ticket });
    } catch (error) {
        handleError(res, error);
    }
};

exports.addResponse = async (req, res) => {
    try {
        const ticket = await ticketService.addTicketResponse({
            ticketId: req.params.ticketId,
            userId: req.user.id,
            role: req.user.role,
            message: req.body.message,
        });

        res.status(200).json({ message: 'Response added successfully', ticket });
    } catch (error) {
        handleError(res, error);
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const ticket = await ticketService.updateTicketStatus({
            ticketId: req.params.ticketId,
            userId: req.user.id,
            role: req.user.role,
            status: req.body.status,
        });

        res.status(200).json({ message: 'Ticket status updated', ticket });
    } catch (error) {
        handleError(res, error);
    }
};