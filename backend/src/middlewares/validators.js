const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Process validation results and throw errors if any
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map((err) => err.msg);
        return next(ApiError.badRequest('Validation failed', messages));
    }
    next();
};

/**
 * Validation rules for elder registration
 */
const elderRegistrationRules = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ max: 100 })
        .withMessage('Name cannot exceed 100 characters'),
    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please enter a valid 10-digit Indian phone number'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('emergencyContactName')
        .trim()
        .notEmpty()
        .withMessage('Emergency contact name is required')
        .isLength({ max: 100 })
        .withMessage('Emergency contact name cannot exceed 100 characters'),
    body('emergencyContactNumber')
        .trim()
        .notEmpty()
        .withMessage('Emergency contact number is required')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please enter a valid 10-digit Indian phone number for emergency contact'),
];

/**
 * Validation rules for volunteer registration
 */
const volunteerRegistrationRules = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ max: 100 })
        .withMessage('Name cannot exceed 100 characters'),
    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please enter a valid 10-digit Indian phone number'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('aadhaarNumber')
        .trim()
        .notEmpty()
        .withMessage('Aadhaar number is required')
        .matches(/^\d{12}$/)
        .withMessage('Aadhaar number must be exactly 12 digits'),
];

/**
 * Validation rules for login
 */
const loginRules = [
    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please enter a valid 10-digit Indian phone number'),
    body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Validation rules for OTP
 */
const otpSendRules = [
    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please enter a valid 10-digit Indian phone number'),
];

const otpVerifyRules = [
    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please enter a valid 10-digit Indian phone number'),
    body('otp')
        .trim()
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
        .isNumeric()
        .withMessage('OTP must be numeric'),
];

/**
 * Validation rules for Aadhaar OTP
 */
const aadhaarOtpSendRules = [
    body('aadhaarNumber')
        .trim()
        .notEmpty()
        .withMessage('Aadhaar number is required')
        .matches(/^\d{12}$/)
        .withMessage('Aadhaar number must be exactly 12 digits'),
];

const aadhaarOtpVerifyRules = [
    body('aadhaarNumber')
        .trim()
        .notEmpty()
        .withMessage('Aadhaar number is required')
        .matches(/^\d{12}$/)
        .withMessage('Aadhaar number must be exactly 12 digits'),
    body('otp')
        .trim()
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
        .isNumeric()
        .withMessage('OTP must be numeric'),
];

/**
 * Validation rules for SOS trigger
 */
const sosTriggerRules = [
    body('latitude')
        .notEmpty()
        .withMessage('Latitude is required')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Invalid latitude value'),
    body('longitude')
        .notEmpty()
        .withMessage('Longitude is required')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Invalid longitude value'),
];

/**
 * Validation rules for profile update
 */
const elderProfileUpdateRules = [
    body('name')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Name cannot exceed 100 characters'),
    body('emergencyContactName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Emergency contact name cannot exceed 100 characters'),
    body('emergencyContactNumber')
        .optional()
        .trim()
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please enter a valid 10-digit Indian phone number'),
];

/**
 * Validation rules for device token update
 */
const deviceTokenRules = [
    body('deviceToken')
        .trim()
        .notEmpty()
        .withMessage('Device token is required'),
];

module.exports = {
    validate,
    elderRegistrationRules,
    volunteerRegistrationRules,
    loginRules,
    otpSendRules,
    otpVerifyRules,
    aadhaarOtpSendRules,
    aadhaarOtpVerifyRules,
    sosTriggerRules,
    elderProfileUpdateRules,
    deviceTokenRules,
};
