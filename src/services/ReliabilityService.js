const Reliability = require('../models/ReliabilityModel.js');
const User = require('../models/UserModel');

const sanitizeReliability = record => (typeof record?.toObject === 'function' ? record.toObject() : record);

const requireReliability = async userId => {
    const reliability = await Reliability.findOne({ user: userId });
    if (!reliability) {
        const error = new Error('Reliability profile not found');
        error.statusCode = 404;
        throw error;
    }
    return reliability;
};

const getReliabilityForUser = async userId => {
    const reliability = await Reliability.findOne({ user: userId }) ||
        await Reliability.create({ user: userId, score: 0 });

    return sanitizeReliability(reliability);
};

const updateReliability = async (userId, updates = {}) => {
    const allowedFields = ['score', 'latePayments', 'missedPayments', 'bonuses'];
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

    const reliability = await Reliability.findOneAndUpdate(
        { user: userId },
        payload,
        { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return sanitizeReliability(reliability);
};

const recordPaymentEvent = async ({ userId, type, amount = 0 }) => {
    const reliability = await Reliability.findOne({ user: userId }) ||
        await Reliability.create({ user: userId, score: 0 });

    switch (type) {
        case 'on_time_payment':
            reliability.score += Math.max(1, Math.round(amount * 0.01));
            break;
        case 'late_payment':
            reliability.latePayments += 1;
            reliability.score = Math.max(0, reliability.score - 5);
            break;
        case 'missed_payment':
            reliability.missedPayments += 1;
            reliability.score = Math.max(0, reliability.score - 15);
            break;
        case 'bonus_award':
            reliability.bonuses += amount;
            reliability.score += amount;
            break;
        default:
            throw Object.assign(new Error('Unknown reliability event type'), { statusCode: 400 });
    }

    await reliability.save();
    return sanitizeReliability(reliability);
};

const getTopReliableUsers = async ({ limit = 10 } = {}) => {
    const users = await Reliability.find()
        .sort({ score: -1 })
        .limit(limit)
        .populate('user', 'username email');

    return users.map(sanitizeReliability);
};

module.exports = {
    getReliabilityForUser,
    updateReliability,
    recordPaymentEvent,
    getTopReliableUsers,
};