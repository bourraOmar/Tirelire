const reliabilityService = require('../services/ReliabilityService');

const handleError = (res, error) => {
    const statusCode = error.statusCode || 500;
    const response = { message: error.statusCode ? error.message : 'Server error' };

    if (!error.statusCode) {
        response.error = error.message;
    }

    return res.status(statusCode).json(response);
};

exports.getMyReliability = async (req, res) => {
    try {
        const reliability = await reliabilityService.getReliabilityForUser(req.user.id);
        res.status(200).json({ reliability });
    } catch (error) {
        handleError(res, error);
    }
};

exports.updateMyReliability = async (req, res) => {
    try {
        const reliability = await reliabilityService.updateReliability(req.user.id, req.body);
        res.status(200).json({ message: 'Reliability updated successfully', reliability });
    } catch (error) {
        handleError(res, error);
    }
};

exports.recordEvent = async (req, res) => {
    try {
        const reliability = await reliabilityService.recordPaymentEvent({
            userId: req.user.id,
            type: req.body.type,
            amount: req.body.amount,
        });
        res.status(200).json({ message: 'Reliability event recorded', reliability });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getTopReliableUsers = async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 10;
        const users = await reliabilityService.getTopReliableUsers({ limit });
        res.status(200).json({ users });
    } catch (error) {
        handleError(res, error);
    }
};