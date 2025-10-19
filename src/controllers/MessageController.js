const messageService = require('../services/MessageService');

const handleError = (res, error) => {
	const statusCode = error.statusCode || 500;
	const response = { message: error.statusCode ? error.message : 'Server error' };

	if (!error.statusCode) {
		response.error = error.message;
	}

	return res.status(statusCode).json(response);
};

exports.createMessage = async (req, res) => {
	try {
		const message = await messageService.createGroupMessage(req.params.groupId, req.user.id, req.body);
		res.status(201).json({ message: 'Message sent successfully', data: message });
	} catch (error) {
		handleError(res, error);
	}
};

exports.getGroupMessages = async (req, res) => {
	try {
		const messages = await messageService.getMessagesForGroup(req.params.groupId, req.user.id);
		res.status(200).json({ messages });
	} catch (error) {
		handleError(res, error);
	}
};

exports.markAsRead = async (req, res) => {
	try {
		const message = await messageService.markMessageAsRead(req.params.messageId, req.user.id);
		res.status(200).json({ message: 'Message marked as read', data: message });
	} catch (error) {
		handleError(res, error);
	}
};

exports.deleteMessage = async (req, res) => {
	try {
		await messageService.deleteMessage(req.params.messageId, req.user.id);
		res.status(200).json({ message: 'Message deleted successfully' });
	} catch (error) {
		handleError(res, error);
	}
};