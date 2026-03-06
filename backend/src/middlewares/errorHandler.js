const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error(`${err.message}`, {
        url: req.originalUrl,
        method: req.method,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error = ApiError.badRequest('Invalid resource ID');
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error = ApiError.badRequest(`${field} already exists`);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((val) => val.message);
        error = ApiError.badRequest('Validation error', messages);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = ApiError.unauthorized('Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        error = ApiError.unauthorized('Token expired');
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    return ApiResponse.error(res, message, statusCode, error.errors || []);
};

module.exports = errorHandler;
