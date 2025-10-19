const Group = require('../models/GroupModel');
const GroupMember = require('../models/GroupMember');
const User = require('../models/UserModel');

const sanitizeGroup = group => {
	if (!group) {
		return null;
	}

	const plain = typeof group.toObject === 'function' ? group.toObject() : { ...group };
	return plain;
};

const requireGroup = async groupId => {
	const group = await Group.findById(groupId);
	if (!group) {
		const error = new Error('Group not found');
		error.statusCode = 404;
		throw error;
	}

	return group;
};

const assertOwner = (group, userId) => {
	if (group.owner.toString() !== userId.toString()) {
		const error = new Error('Only the owner can perform this action');
		error.statusCode = 403;
		throw error;
	}
};

const createGroup = async (ownerId, data = {}) => {
	if (!data.name) {
		const error = new Error('Group name is required');
		error.statusCode = 400;
		throw error;
	}

	const group = await Group.create({
		name: data.name,
		description: data.description || '',
		owner: ownerId,
		members: [ownerId],
		isPrivate: Boolean(data.isPrivate),
	});

	await GroupMember.create({
		user: ownerId,
		group: group._id,
		role: 'admin',
	});

	await User.findByIdAndUpdate(
		ownerId,
		{ $addToSet: { groups: group._id } },
		{ new: false },
	);

	const populated = await Group.findById(group._id)
		.populate('owner', '-password')
		.populate('members', '-password');

	return sanitizeGroup(populated);
};

const getGroupsForUser = async userId => {
	const groups = await Group.find({
		$or: [{ owner: userId }, { members: userId }],
	})
		.populate('owner', '-password')
		.populate('members', '-password');

	return groups.map(sanitizeGroup);
};

const getGroupById = async (groupId, userId) => {
	const group = await requireGroup(groupId);

	const isMember =
		group.owner.toString() === userId.toString() ||
		group.members.some(memberId => memberId.toString() === userId.toString());

	if (!isMember && group.isPrivate) {
		const error = new Error('You do not have access to this group');
		error.statusCode = 403;
		throw error;
	}

	const populated = await Group.findById(groupId)
		.populate('owner', '-password')
		.populate('members', '-password')
		.populate({
			path: 'messages',
			populate: { path: 'sender', select: '-password' },
		});

	return sanitizeGroup(populated);
};

const updateGroup = async (groupId, userId, updates = {}) => {
	const group = await requireGroup(groupId);
	assertOwner(group, userId);

	const allowedFields = ['name', 'description', 'isPrivate'];
	const payload = {};

	allowedFields.forEach(field => {
		if (Object.prototype.hasOwnProperty.call(updates, field)) {
			payload[field] = updates[field];
		}
	});

	if (Object.keys(payload).length === 0) {
		const error = new Error('No valid fields provided for update');
		error.statusCode = 400;
		throw error;
	}

	const updated = await Group.findByIdAndUpdate(
		groupId,
		payload,
		{ new: true, runValidators: true },
	)
		.populate('owner', '-password')
		.populate('members', '-password');

	return sanitizeGroup(updated);
};

const deleteGroup = async (groupId, userId) => {
	const group = await requireGroup(groupId);
	assertOwner(group, userId);

	await GroupMember.deleteMany({ group: groupId });

	await User.updateMany(
		{ groups: groupId },
		{ $pull: { groups: groupId } },
	);

	await Group.findByIdAndDelete(groupId);

	return { success: true };
};

const addMember = async (groupId, requesterId, memberId) => {
	if (!memberId) {
		const error = new Error('Member id is required');
		error.statusCode = 400;
		throw error;
	}

	const group = await requireGroup(groupId);
	assertOwner(group, requesterId);

	if (group.members.some(id => id.toString() === memberId.toString())) {
		const error = new Error('Member already in group');
		error.statusCode = 400;
		throw error;
	}

	const member = await User.findById(memberId);
	if (!member) {
		const error = new Error('User to add not found');
		error.statusCode = 404;
		throw error;
	}

	group.members.push(memberId);
	await group.save();

	await GroupMember.findOneAndUpdate(
		{ user: memberId, group: groupId },
		{ user: memberId, group: groupId, role: 'member' },
		{ new: true, upsert: true, setDefaultsOnInsert: true },
	);

	await User.findByIdAndUpdate(memberId, { $addToSet: { groups: groupId } });

	const populated = await Group.findById(groupId)
		.populate('owner', '-password')
		.populate('members', '-password');

	return sanitizeGroup(populated);
};

const removeMember = async (groupId, requesterId, memberId) => {
	const group = await requireGroup(groupId);
	assertOwner(group, requesterId);

	if (group.owner.toString() === memberId.toString()) {
		const error = new Error('Owner cannot be removed from the group');
		error.statusCode = 400;
		throw error;
	}

	const hasMember = group.members.some(id => id.toString() === memberId.toString());
	if (!hasMember) {
		const error = new Error('Member not found in group');
		error.statusCode = 404;
		throw error;
	}

	group.members = group.members.filter(id => id.toString() !== memberId.toString());
	await group.save();

	await GroupMember.findOneAndDelete({ group: groupId, user: memberId });
	await User.findByIdAndUpdate(memberId, { $pull: { groups: groupId } });

	const populated = await Group.findById(groupId)
		.populate('owner', '-password')
		.populate('members', '-password');

	return sanitizeGroup(populated);
};

module.exports = {
	createGroup,
	getGroupsForUser,
	getGroupById,
	updateGroup,
	deleteGroup,
	addMember,
	removeMember,
};