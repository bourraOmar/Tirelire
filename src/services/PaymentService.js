const Payment = require('../models/PaymentModel');

let StripeConstructor;
try {
	StripeConstructor = require('stripe');
} catch (error) {
	StripeConstructor = null;
}

let stripeClient;

const sanitizePayment = payment => (typeof payment?.toObject === 'function' ? payment.toObject() : payment);

const getStripeClient = () => {
	if (stripeClient) {
		return stripeClient;
	}

	if (!StripeConstructor) {
		const error = new Error('Stripe dependency not installed. Run "npm install stripe".');
		error.statusCode = 500;
		throw error;
	}

	const secretKey = process.env.STRIPE_SECRET_KEY;
	if (!secretKey) {
		const error = new Error('Stripe secret key missing. Set STRIPE_SECRET_KEY in environment.');
		error.statusCode = 500;
		throw error;
	}

	stripeClient = StripeConstructor(secretKey, {
		apiVersion: process.env.STRIPE_API_VERSION || '2024-06-20',
	});

	return stripeClient;
};

const toStripeAmount = amount => {
	if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
		const error = new Error('Amount must be a positive number');
		error.statusCode = 400;
		throw error;
	}

	return Math.round(amount * 100);
};

const mapPaymentMethod = method => {
	if (!method) {
		return 'credit_card';
	}

	const normalized = method.toLowerCase();
	if (['credit_card', 'paypal', 'cash'].includes(normalized)) {
		return normalized;
	}

	const error = new Error('Unsupported payment method');
	error.statusCode = 400;
	throw error;
};

const mapStripeStatus = status => {
	switch (status) {
		case 'succeeded':
			return 'completed';
		case 'processing':
		case 'requires_action':
		case 'requires_payment_method':
			return 'pending';
		case 'canceled':
		case 'requires_capture':
		default:
			return 'failed';
	}
};

const createPaymentIntent = async (userId, { amount, currency = 'MAD', method = 'credit_card', metadata = {} } = {}) => {
	const stripeAmount = toStripeAmount(amount);
	const mappedMethod = mapPaymentMethod(method);

	const payment = await Payment.create({
		user: userId,
		amount,
		currency: currency.toUpperCase(),
		method: mappedMethod,
		status: 'pending',
	});

	const stripe = getStripeClient();
	const intent = await stripe.paymentIntents.create({
		amount: stripeAmount,
		currency: currency.toLowerCase(),
		metadata: {
			paymentId: payment._id.toString(),
			userId: userId.toString(),
			...metadata,
		},
		automatic_payment_methods: {
			enabled: true,
		},
	});

	payment.transactionId = intent.id;
	payment.status = mapStripeStatus(intent.status);
	await payment.save();

	return {
		payment: sanitizePayment(payment),
		clientSecret: intent.client_secret,
	};
};

const syncPaymentIntent = async ({ paymentIntentId, userId }) => {
	const stripe = getStripeClient();
	const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

	const payment = await Payment.findOne({ transactionId: intent.id, user: userId });
	if (!payment) {
		const error = new Error('Payment record not found for this intent');
		error.statusCode = 404;
		throw error;
	}

	payment.status = mapStripeStatus(intent.status);
	await payment.save();

	return sanitizePayment(payment);
};

const listPaymentsForUser = async userId => {
	const payments = await Payment.find({ user: userId }).sort({ createdAt: -1 });
	return payments.map(sanitizePayment);
};

const getPaymentById = async ({ paymentId, userId }) => {
	const payment = await Payment.findOne({ _id: paymentId, user: userId });
	if (!payment) {
		const error = new Error('Payment not found');
		error.statusCode = 404;
		throw error;
	}

	return sanitizePayment(payment);
};

const cancelPaymentIntent = async ({ paymentId, userId }) => {
	const payment = await Payment.findOne({ _id: paymentId, user: userId });
	if (!payment) {
		const error = new Error('Payment not found');
		error.statusCode = 404;
		throw error;
	}

	if (payment.status === 'completed') {
		const error = new Error('Completed payments cannot be canceled');
		error.statusCode = 400;
		throw error;
	}

	if (payment.transactionId) {
		const stripe = getStripeClient();
		try {
			await stripe.paymentIntents.cancel(payment.transactionId);
		} catch (error) {
			const err = new Error('Unable to cancel payment intent on Stripe');
			err.statusCode = 400;
			throw err;
		}
	}

	payment.status = 'failed';
	await payment.save();

	return sanitizePayment(payment);
};

module.exports = {
	createPaymentIntent,
	syncPaymentIntent,
	listPaymentsForUser,
	getPaymentById,
	cancelPaymentIntent,
};