const groupService = require('../services/GroupService');

const handleError = (res, error) => {
	const statusCode = error.statusCode || 500;
	const response = { message: error.statusCode ? error.message : 'Server error' };

	if (!error.statusCode) {
		response.error = error.message;
	}

	return res.status(statusCode).json(response);
};

exports.createGroup = async (req, res) => {
	try {
		const group = await groupService.createGroup(req.user.id, req.body);
		res.status(201).json({ message: 'Group created successfully', group });
	} catch (error) {
		handleError(res, error);
	}
};

exports.getMyGroups = async (req, res) => {
	try {
		const groups = await groupService.getGroupsForUser(req.user.id);
		res.status(200).json({ groups });
	} catch (error) {
		handleError(res, error);
	}
};

exports.getGroupById = async (req, res) => {
	try {
		const group = await groupService.getGroupById(req.params.groupId, req.user.id);
		res.status(200).json({ group });
	} catch (error) {
		handleError(res, error);
	}
};

exports.updateGroup = async (req, res) => {
	try {
		const group = await groupService.updateGroup(req.params.groupId, req.user.id, req.body);
		res.status(200).json({ message: 'Group updated successfully', group });
	} catch (error) {
		handleError(res, error);
	}
};

exports.deleteGroup = async (req, res) => {
	try {
		await groupService.deleteGroup(req.params.groupId, req.user.id);
		res.status(200).json({ message: 'Group deleted successfully' });
	} catch (error) {
		handleError(res, error);
	}
};

exports.addMember = async (req, res) => {
	try {
		const group = await groupService.addMember(req.params.groupId, req.user.id, req.body.userId);
		res.status(200).json({ message: 'Member added successfully', group });
	} catch (error) {
		handleError(res, error);
	}
};

exports.removeMember = async (req, res) => {
	try {
		const group = await groupService.removeMember(req.params.groupId, req.user.id, req.params.memberId);
		res.status(200).json({ message: 'Member removed successfully', group });
	} catch (error) {
		handleError(res, error);
	}
};