const jwt = require('jsonwebtoken');
const Elder = require('../models/Elder');
const Volunteer = require('../models/Volunteer');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect routes - verify JWT token
 */
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw ApiError.unauthorized('Not authorized. Please log in.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user based on role
        let user;
        if (decoded.role === 'elder') {
            user = await Elder.findById(decoded.id);
        } else if (decoded.role === 'volunteer') {
            user = await Volunteer.findById(decoded.id);
        }

        if (!user) {
            throw ApiError.unauthorized('User not found. Please log in again.');
        }

        req.user = user;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw ApiError.unauthorized('Invalid token. Please log in again.');
        }
        if (error.name === 'TokenExpiredError') {
            throw ApiError.unauthorized('Token expired. Please log in again.');
        }
        throw error;
    }
});

/**
 * Restrict access to specific roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return next(ApiError.forbidden('You do not have permission to perform this action.'));
        }
        next();
    };
};

module.exports = { protect, authorize };
