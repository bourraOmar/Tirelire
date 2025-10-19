const authService = require('../services/AuthService');

const handleError = (res, error) => {
    const statusCode = error.statusCode || 500;
    const response = {
        message: error.statusCode ? error.message : 'Server error',
    };

    if (!error.statusCode) {
        response.error = error.message;
    }

    return res.status(statusCode).json(response);
};

exports.register = async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        handleError(res, error);
    }
};

exports.login = async (req, res) => {
    try {
        const { token, user } = await authService.loginUser(req.body);
        res.status(200).json({ message: 'Login successful', token, user });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await authService.getUserProfile(req.user.id);
        res.status(200).json({ user });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getUserInfo = async (req, res) => {
    try {
        const user = await authService.getUserInfo(req.user.id);
        res.status(200).json({ user });
    } catch (error) {
        handleError(res, error);
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await authService.updateUserProfile(req.user.id, req.body);
        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
        handleError(res, error);
    }
};