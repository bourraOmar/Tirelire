const Ticket = require('../models/TicketModel');

const sanitizeTicket = ticket => (typeof ticket?.toObject === 'function' ? ticket.toObject() : ticket);

const ensureTicketAccess = (ticket, userId, userRole) => {
    const ticketUserId = ticket.user?._id ? ticket.user._id : ticket.user;
    const isOwner = ticketUserId.toString() === userId.toString();
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
        const error = new Error('You do not have access to this ticket');
        error.statusCode = 403;
        throw error;
    }
};

const createTicket = async ({ userId, subject, description, priority = 'medium' }) => {
    if (!subject || !description) {
        const error = new Error('Subject and description are required');
        error.statusCode = 400;
        throw error;
    }

    const ticket = await Ticket.create({
        user: userId,
        subject,
        description,
        priority,
    });

    const populated = await Ticket.findById(ticket._id)
        .populate('user', 'username email role')
        .populate('responses.responder', 'username email role');
    return sanitizeTicket(populated);
};

const listTickets = async ({ userId, role, status }) => {
    const query = {};

    if (role !== 'admin') {
        query.user = userId;
    }

    if (status) {
        query.status = status;
    }

    const tickets = await Ticket.find(query)
        .sort({ createdAt: -1 })
        .populate('user', 'username email role')
        .populate('responses.responder', 'username email role');

    return tickets.map(sanitizeTicket);
};

const getTicketById = async ({ ticketId, userId, role }) => {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
        const error = new Error('Ticket not found');
        error.statusCode = 404;
        throw error;
    }

    ensureTicketAccess(ticket, userId, role);

    const populated = await Ticket.findById(ticketId)
        .populate('user', 'username email role')
        .populate('responses.responder', 'username email role');

    return sanitizeTicket(populated);
};

const addTicketResponse = async ({ ticketId, userId, role, message }) => {
    if (!message) {
        const error = new Error('Response message is required');
        error.statusCode = 400;
        throw error;
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
        const error = new Error('Ticket not found');
        error.statusCode = 404;
        throw error;
    }

    ensureTicketAccess(ticket, userId, role);

    ticket.responses.push({
        message,
        responder: userId,
        date: new Date(),
    });

    if (role === 'admin' && ticket.status === 'open') {
        ticket.status = 'in_progress';
    }

    await ticket.save();

    const populated = await Ticket.findById(ticketId)
        .populate('user', 'username email role')
        .populate('responses.responder', 'username email role');

    return sanitizeTicket(populated);
};

const updateTicketStatus = async ({ ticketId, userId, role, status }) => {
    const allowedStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!allowedStatuses.includes(status)) {
        const error = new Error('Invalid ticket status');
        error.statusCode = 400;
        throw error;
    }

    if (role !== 'admin') {
        const error = new Error('Only admins can update ticket status');
        error.statusCode = 403;
        throw error;
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
        const error = new Error('Ticket not found');
        error.statusCode = 404;
        throw error;
    }

    ticket.status = status;
    await ticket.save();

    const populated = await Ticket.findById(ticketId)
        .populate('user', 'username email role')
        .populate('responses.responder', 'username email role');

    return sanitizeTicket(populated);
};

module.exports = {
    createTicket,
    listTickets,
    getTicketById,
    addTicketResponse,
    updateTicketStatus,
};