const kycService = require('../services/KycService');

const handleError = (res, error) => {
	const statusCode = error.statusCode || 500;
	const response = { message: error.statusCode ? error.message : 'Server error' };

	if (!error.statusCode) {
		response.error = error.message;
	}

	if (error.details) {
		response.details = error.details;
	}

	return res.status(statusCode).json(response);
};

exports.submitKYC = async (req, res) => {
	try {
		const kyc = await kycService.submitKYC(req.user.id, req.body);
		res.status(201).json({ message: 'KYC submitted successfully', kyc });
	} catch (error) {
		handleError(res, error);
	}
};

exports.getMyKYC = async (req, res) => {
	try {
		const kyc = await kycService.getMyKYC(req.user.id);
		res.status(200).json({ kyc });
	} catch (error) {
		handleError(res, error);
	}
};

exports.verifyKYCByAI = async (req, res) => {
	try {
		const kyc = await kycService.verifyKYCByAI(req.params.id, req.body);
		res.status(200).json({ message: 'KYC AI verification updated', kyc });
	} catch (error) {
		handleError(res, error);
	}
};

exports.getKycById = async (req, res) => {
	try {
		const kyc = await kycService.getKycById(req.params.id);
		res.status(200).json({ kyc });
	} catch (error) {
		handleError(res, error);
	}
};