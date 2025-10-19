const turnService = require('../services/TurnService');

const handleError = (res, error) => {
    const statusCode = error.statusCode || 500;
    const response = { message: error.statusCode ? error.message : 'Server error' };

    if (!error.statusCode) {
        response.error = error.message;
    }

    return res.status(statusCode).json(response);
};

exports.scheduleTurn = async (req, res) => {
    try {
        const turn = await turnService.scheduleTurn({
            groupId: req.params.groupId,
            memberId: req.body.memberId,
            month: req.body.month,
            year: req.body.year,
            requesterId: req.user.id,
        });

        res.status(201).json({ message: 'Turn scheduled successfully', turn });
    } catch (error) {
        handleError(res, error);
    }
};

exports.listTurns = async (req, res) => {
    try {
        const turns = await turnService.listTurnsForGroup({
            groupId: req.params.groupId,
            requesterId: req.user.id,
        });

        res.status(200).json({ turns });
    } catch (error) {
        handleError(res, error);
    }
};

exports.markTurnCompleted = async (req, res) => {
    try {
        const turn = await turnService.markTurnCompleted({
            turnId: req.params.turnId,
            requesterId: req.user.id,
            totalReceived: req.body.totalReceived,
        });

        res.status(200).json({ message: 'Turn marked as completed', turn });
    } catch (error) {
        handleError(res, error);
    }
};

exports.deleteTurn = async (req, res) => {
    try {
        await turnService.deleteTurn({
            turnId: req.params.turnId,
            requesterId: req.user.id,
        });

        res.status(200).json({ message: 'Turn deleted successfully' });
    } catch (error) {
        handleError(res, error);
    }
};