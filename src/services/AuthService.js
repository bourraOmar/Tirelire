const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sanitizeUser = user => {
	if (!user) {
		return null;
	}

	const plainUser = typeof user.toObject === 'function' ? user.toObject() : { ...user };
	delete plainUser.password;
	return plainUser;
};

const registerUser = async ({ username, email, password }) => {
	if (!username || !email || !password) {
		const error = new Error('Missing required registration fields');
		error.statusCode = 400;
		throw error;
	}

	const existingUser = await User.findOne({ email });
	if (existingUser) {
		const error = new Error('User already exists');
		error.statusCode = 400;
		throw error;
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	const user = await User.create({
		username,
		email,
		password: hashedPassword,
	});

	return sanitizeUser(user);
};

const ensureJwtSecret = () => {
	if (!process.env.JWT_SECRET) {
		const error = new Error('JWT secret is not configured');
		error.statusCode = 500;
		throw error;
	}

	return process.env.JWT_SECRET;
};

const loginUser = async ({ email, password }) => {
	if (!email || !password) {
		const error = new Error('Missing login credentials');
		error.statusCode = 400;
		throw error;
	}

	const user = await User.findOne({ email }).select('+password');
	if (!user) {
		const error = new Error('Invalid credentials');
		error.statusCode = 400;
		throw error;
	}

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		const error = new Error('Invalid credentials');
		error.statusCode = 400;
		throw error;
	}

	const token = jwt.sign(
		{ id: user._id, role: user.role },
		ensureJwtSecret(),
		{ expiresIn: '1h' },
	);

	return { token, user: sanitizeUser(user) };
};

const getUserProfile = async userId => {
	const user = await User.findById(userId);
	if (!user) {
		const error = new Error('User not found');
		error.statusCode = 404;
		throw error;
	}

	return sanitizeUser(user);
};

const getUserInfo = async userId => {
	const user = await User.findById(userId);
	if (!user) {
		const error = new Error('User not found');
		error.statusCode = 404;
		throw error;
	}

	return sanitizeUser(user);
};

const updateUserProfile = async (userId, updates) => {
	const allowedFields = ['username', 'avatar', 'bio'];
	const updatePayload = {};

	allowedFields.forEach(field => {
		if (Object.prototype.hasOwnProperty.call(updates, field)) {
			updatePayload[field] = updates[field];
		}
	});

	if (Object.keys(updatePayload).length === 0) {
		const error = new Error('No valid fields provided for update');
		error.statusCode = 400;
		throw error;
	}

	const user = await User.findByIdAndUpdate(userId, updatePayload, {
		new: true,
		runValidators: true,
	});

	if (!user) {
		const error = new Error('User not found');
		error.statusCode = 404;
		throw error;
	}

	return sanitizeUser(user);
};

module.exports = {
	registerUser,
	loginUser,
	getUserProfile,
	getUserInfo,
	updateUserProfile,
};