const Message = require('../models/MessageModel');
const Group = require('../models/GroupModel');
const User = require('../models/UserModel');

const sanitizeMessage = message => {
    if (!message) {
        return null;
    }

    const plain = typeof message.toObject === 'function' ? message.toObject() : { ...message };
    return plain;
};

const ensureGroupAccess = async (groupId, userId) => {
    const group = await Group.findById(groupId);
    if (!group) {
        const error = new Error('Group not found');
        error.statusCode = 404;
        throw error;
    }

    const memberIds = group.members.map(id => id.toString());
    const isOwner = group.owner.toString() === userId.toString();
    const isMember = memberIds.includes(userId.toString());

    if (!isOwner && !isMember) {
        const error = new Error('You do not have access to this group');
        error.statusCode = 403;
        throw error;
    }

    return group;
};

const createGroupMessage = async (groupId, senderId, data = {}) => {
    if (!data.content) {
        const error = new Error('Message content is required');
        error.statusCode = 400;
        throw error;
    }

    const group = await ensureGroupAccess(groupId, senderId);

    const message = await Message.create({
        sender: senderId,
        group: groupId,
        content: data.content,
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
    });

    await Group.findByIdAndUpdate(groupId, { $addToSet: { messages: message._id } });
    await User.findByIdAndUpdate(senderId, { $addToSet: { messages: message._id } });

    const populated = await Message.findById(message._id)
        .populate('sender', '-password')
        .populate('group');

    return sanitizeMessage(populated);
};

const getMessagesForGroup = async (groupId, userId) => {
    await ensureGroupAccess(groupId, userId);

    const messages = await Message.find({ group: groupId })
        .sort({ createdAt: 1 })
        .populate('sender', '-password');

    return messages.map(sanitizeMessage);
};

const markMessageAsRead = async (messageId, userId) => {
    const message = await Message.findById(messageId);
    if (!message) {
        const error = new Error('Message not found');
        error.statusCode = 404;
        throw error;
    }

    if (message.sender.toString() !== userId.toString()) {
        await ensureGroupAccess(message.group, userId);
    }

    if (message.isRead) {
        return sanitizeMessage(message);
    }

    message.isRead = true;
    await message.save();

    const populated = await Message.findById(messageId).populate('sender', '-password');
    return sanitizeMessage(populated);
};

const deleteMessage = async (messageId, userId) => {
    const message = await Message.findById(messageId);
    if (!message) {
        const error = new Error('Message not found');
        error.statusCode = 404;
        throw error;
    }

    const group = await ensureGroupAccess(message.group, userId);

    const isSender = message.sender.toString() === userId.toString();
    const isOwner = group.owner.toString() === userId.toString();

    if (!isSender && !isOwner) {
        const error = new Error('Only the sender or group owner can delete this message');
        error.statusCode = 403;
        throw error;
    }

    await Group.findByIdAndUpdate(group._id, { $pull: { messages: message._id } });
    await User.updateMany(
        { messages: message._id },
        { $pull: { messages: message._id } },
    );

    await Message.findByIdAndDelete(messageId);

    return { success: true };
};

module.exports = {
    createGroupMessage,
    getMessagesForGroup,
    markMessageAsRead,
    deleteMessage,
};