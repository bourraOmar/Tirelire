const paymentService = require('../services/PaymentService');

const handleError = (res, error) => {
	const statusCode = error.statusCode || 500;
	const response = { message: error.statusCode ? error.message : 'Server error' };

	if (!error.statusCode) {
		response.error = error.message;
	}

	return res.status(statusCode).json(response);
};

exports.createPaymentIntent = async (req, res) => {
	try {
		const result = await paymentService.createPaymentIntent(req.user.id, req.body);
		res.status(201).json({ message: 'Payment intent created', ...result });
	} catch (error) {
		handleError(res, error);
	}
};

exports.syncPayment = async (req, res) => {
	try {
		const payment = await paymentService.syncPaymentIntent({
			paymentIntentId: req.params.paymentIntentId,
			userId: req.user.id,
		});
		res.status(200).json({ message: 'Payment status updated', payment });
	} catch (error) {
		handleError(res, error);
	}
};

exports.getMyPayments = async (req, res) => {
	try {
		const payments = await paymentService.listPaymentsForUser(req.user.id);
		res.status(200).json({ payments });
	} catch (error) {
		handleError(res, error);
	}
};

exports.getPaymentById = async (req, res) => {
	try {
		const payment = await paymentService.getPaymentById({
			paymentId: req.params.paymentId,
			userId: req.user.id,
		});
		res.status(200).json({ payment });
	} catch (error) {
		handleError(res, error);
	}
};

exports.cancelPayment = async (req, res) => {
	try {
		const payment = await paymentService.cancelPaymentIntent({
			paymentId: req.params.paymentId,
			userId: req.user.id,
		});
		res.status(200).json({ message: 'Payment canceled', payment });
	} catch (error) {
		handleError(res, error);
	}
};