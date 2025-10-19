const Turn = require('../models/TurnModel');
const Group = require('../models/GroupModel');
const GroupMember = require('../models/GroupMember');

const sanitizeTurn = turn => (typeof turn?.toObject === 'function' ? turn.toObject() : turn);

const requireTurn = async (turnId, userId) => {
    const turn = await Turn.findById(turnId).populate('group member', '-password');
    if (!turn) {
        const error = new Error('Turn not found');
        error.statusCode = 404;
        throw error;
    }

    const belongsToUser = turn.member._id.toString() === userId.toString();
    const isGroupOwner = turn.group.owner.toString() === userId.toString();

    if (!belongsToUser && !isGroupOwner) {
        const error = new Error('You do not have access to this turn');
        error.statusCode = 403;
        throw error;
    }

    return turn;
};

const validateGroupAndMembership = async (groupId, memberId, requesterId) => {
    const group = await Group.findById(groupId);
    if (!group) {
        const error = new Error('Group not found');
        error.statusCode = 404;
        throw error;
    }

    const isGroupOwner = group.owner.toString() === requesterId.toString();
    const isRequesterMember = group.members.some(id => id.toString() === requesterId.toString());

    if (!isGroupOwner && !isRequesterMember) {
        const error = new Error('You do not have access to this group');
        error.statusCode = 403;
        throw error;
    }

    const memberRecord = await GroupMember.findOne({ group: groupId, user: memberId });
    if (!memberRecord) {
        const error = new Error('Member is not part of this group');
        error.statusCode = 400;
        throw error;
    }

    return { group, memberRecord };
};

const scheduleTurn = async ({ groupId, memberId, month, year, requesterId }) => {
    if (typeof month !== 'number' || month < 1 || month > 12) {
        const error = new Error('Month must be between 1 and 12');
        error.statusCode = 400;
        throw error;
    }

    if (typeof year !== 'number' || year < 2000) {
        const error = new Error('Year must be a valid number');
        error.statusCode = 400;
        throw error;
    }

    const { group } = await validateGroupAndMembership(groupId, memberId, requesterId);

    const existing = await Turn.findOne({ group: groupId, month, year });
    if (existing) {
        const error = new Error('A turn is already scheduled for this month');
        error.statusCode = 400;
        throw error;
    }

    const turn = await Turn.create({
        group: groupId,
        member: memberId,
        month,
        year,
        isCompleted: false,
        totalReceived: 0,
    });

    const populated = await Turn.findById(turn._id)
        .populate('group', 'name owner')
        .populate('member', 'username email');

    return sanitizeTurn(populated);
};

const listTurnsForGroup = async ({ groupId, requesterId }) => {
    const group = await Group.findById(groupId);
    if (!group) {
        const error = new Error('Group not found');
        error.statusCode = 404;
        throw error;
    }

    const isGroupOwner = group.owner.toString() === requesterId.toString();
    const isMember = group.members.some(id => id.toString() === requesterId.toString());

    if (!isGroupOwner && !isMember) {
        const error = new Error('You do not have access to this group');
        error.statusCode = 403;
        throw error;
    }

    const turns = await Turn.find({ group: groupId })
        .sort({ year: 1, month: 1 })
        .populate('member', 'username email');

    return turns.map(sanitizeTurn);
};

const markTurnCompleted = async ({ turnId, requesterId, totalReceived }) => {
    const turn = await requireTurn(turnId, requesterId);

    if (turn.isCompleted) {
        return sanitizeTurn(turn);
    }

    turn.isCompleted = true;
    if (typeof totalReceived === 'number') {
        turn.totalReceived = totalReceived;
    }

    await turn.save();
    return sanitizeTurn(turn);
};

const deleteTurn = async ({ turnId, requesterId }) => {
    const turn = await requireTurn(turnId, requesterId);

    await Turn.findByIdAndDelete(turn._id);

    return { success: true };
};

module.exports = {
    scheduleTurn,
    listTurnsForGroup,
    markTurnCompleted,
    deleteTurn,
};