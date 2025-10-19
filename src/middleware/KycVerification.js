const kycService = require('../services/KycService');

module.exports = async (req, res, next) => {
    try {
        await kycService.ensureUserKycVerified(req.user.id);
        next();
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const response = { message: error.statusCode ? error.message : 'Server error' };
        if (!error.statusCode) {
            response.error = error.message;
        }
        res.status(statusCode).json(response);
    }
};