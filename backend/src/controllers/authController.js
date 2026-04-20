const jwt = require('jsonwebtoken');
const Elder = require('../models/Elder');
const Volunteer = require('../models/Volunteer');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const otpService = require('../services/otpService');

/**
 * Generate JWT token
 */
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });
};

/**
 * @desc    Register elder user
 * @route   POST /api/auth/elder/register
 * @access  Public
 */
const registerElder = asyncHandler(async (req, res) => {
    const { name, email, phone, password, emergencyContactName, emergencyContactNumber } = req.body;

    // Check if elder already exists
    const existingElder = await Elder.findOne({ email });
    if (existingElder) {
        throw ApiError.badRequest('An account with this email already exists');
    }
    
    const existingPhone = await Elder.findOne({ phone });
    if (existingPhone) {
        throw ApiError.badRequest('An account with this phone number already exists');
    }

    const elder = await Elder.create({
        name,
        email,
        phone,
        password,
        emergencyContactName,
        emergencyContactNumber,
    });

    const token = generateToken(elder._id, 'elder');

    return ApiResponse.created(res, {
        user: elder,
        token,
    }, 'Elder registered successfully');
});

/**
 * @desc    Register volunteer
 * @route   POST /api/auth/volunteer/register
 * @access  Public
 */
const registerVolunteer = asyncHandler(async (req, res) => {
    const { name, email, phone, password, aadhaarNumber } = req.body;

    // Check if volunteer already exists
    const existingVolunteer = await Volunteer.findOne({ email });
    if (existingVolunteer) {
        throw ApiError.badRequest('An account with this email already exists');
    }
    
    const existingPhone = await Volunteer.findOne({ phone });
    if (existingPhone) {
        throw ApiError.badRequest('An account with this phone number already exists');
    }

    // Encrypt and mask Aadhaar
    const aadhaarEncrypted = Volunteer.encryptAadhaar(aadhaarNumber);
    const aadhaarMasked = Volunteer.maskAadhaar(aadhaarNumber);

    const volunteer = await Volunteer.create({
        name,
        email,
        phone,
        password,
        aadhaarEncrypted,
        aadhaarMasked,
    });

    const token = generateToken(volunteer._id, 'volunteer');

    return ApiResponse.created(res, {
        user: volunteer,
        token,
    }, 'Volunteer registered successfully. Please verify your Aadhaar to become active.');
});

/**
 * @desc    Login elder
 * @route   POST /api/auth/elder/login
 * @access  Public
 */
const loginElder = asyncHandler(async (req, res) => {
    const { phone, password } = req.body;

    const elder = await Elder.findOne({ phone }).select('+password');
    if (!elder) {
        throw ApiError.unauthorized('Invalid phone number or password');
    }

    const isMatch = await elder.comparePassword(password);
    if (!isMatch) {
        throw ApiError.unauthorized('Invalid phone number or password');
    }

    const token = generateToken(elder._id, 'elder');

    return ApiResponse.success(res, {
        user: elder,
        token,
    }, 'Login successful');
});

/**
 * @desc    Login volunteer
 * @route   POST /api/auth/volunteer/login
 * @access  Public
 */
const loginVolunteer = asyncHandler(async (req, res) => {
    const { phone, password } = req.body;

    const volunteer = await Volunteer.findOne({ phone }).select('+password');
    if (!volunteer) {
        throw ApiError.unauthorized('Invalid phone number or password');
    }

    const isMatch = await volunteer.comparePassword(password);
    if (!isMatch) {
        throw ApiError.unauthorized('Invalid phone number or password');
    }

    const token = generateToken(volunteer._id, 'volunteer');

    return ApiResponse.success(res, {
        user: volunteer,
        token,
    }, 'Login successful');
});

/**
 * @desc    Send phone OTP
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await otpService.sendEmailOTP(email);
    return ApiResponse.success(res, result, 'OTP sent to your email');
});

/**
 * @desc    Verify phone OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const result = await otpService.verifyEmailOTP(email, otp);

    if (!result.success) {
        throw ApiError.badRequest(result.message);
    }

    // Mark email as verified for matched user
    const elder = await Elder.findOne({ email });
    if (elder) {
        elder.emailVerified = true;
        await elder.save();
    }

    const volunteer = await Volunteer.findOne({ email });
    if (volunteer) {
        volunteer.emailVerified = true;
        await volunteer.save();
    }

    return ApiResponse.success(res, null, 'Email verified successfully');
});

/**
 * @desc    Send Aadhaar OTP
 * @route   POST /api/auth/aadhaar/send-otp
 * @access  Private (Volunteer only)
 */
const sendAadhaarOTP = asyncHandler(async (req, res) => {
    const { aadhaarNumber } = req.body;
    const result = await otpService.sendAadhaarOTP(aadhaarNumber);
    return ApiResponse.success(res, result, 'Aadhaar OTP sent');
});

/**
 * @desc    Verify Aadhaar OTP
 * @route   POST /api/auth/aadhaar/verify-otp
 * @access  Private (Volunteer only)
 */
const verifyAadhaarOTP = asyncHandler(async (req, res) => {
    const { aadhaarNumber, otp } = req.body;
    const result = await otpService.verifyAadhaarOTP(aadhaarNumber, otp);

    if (!result.success) {
        throw ApiError.badRequest(result.message);
    }

    // Mark volunteer as Aadhaar verified and activate
    const volunteer = await Volunteer.findById(req.user._id);
    if (volunteer) {
        volunteer.aadhaarVerified = true;
        volunteer.isVerified = true; // Auto-activation after Aadhaar OTP verification
        await volunteer.save();
    }

    return ApiResponse.success(res, { isVerified: true }, 'Aadhaar verified. Your account is now active.');
});

/**
 * @desc    Request OTP for password reset (forgot password)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await otpService.sendForgotPasswordOTP(email);
    return ApiResponse.success(res, { expiresInMinutes: result.expiresInMinutes }, result.message);
});

/**
 * @desc    Verify OTP for password reset
 * @route   POST /api/auth/forgot-password/verify-otp
 * @access  Public
 */
const verifyForgotPasswordOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const result = await otpService.verifyForgotPasswordOTP(email, otp);

    if (!result.success) {
        throw ApiError.badRequest(result.message);
    }

    return ApiResponse.success(res, null, result.message);
});

/**
 * @desc    Reset password after OTP verification
 * @route   POST /api/auth/forgot-password/reset
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    // Re-verify OTP is still valid and verified at this step
    const otpRecord = await require('../models/OTP').findOne({
        email,
        type: 'forgot_password',
        verified: true,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
        throw ApiError.badRequest('OTP not verified. Please complete OTP verification first.');
    }

    if (otpRecord.expiresAt < new Date()) {
        await otpRecord.deleteOne();
        throw ApiError.badRequest('Session expired. Please start over.');
    }

    // Update password for whichever user type holds this email
    let updated = false;

    const elder = await Elder.findOne({ email }).select('+password');
    if (elder) {
        elder.password = newPassword;
        await elder.save();
        updated = true;
    }

    const volunteer = await Volunteer.findOne({ email }).select('+password');
    if (volunteer) {
        volunteer.password = newPassword;
        await volunteer.save();
        updated = true;
    }

    if (!updated) {
        throw ApiError.notFound('No account found with this email.');
    }

    // Invalidate the OTP record after successful password reset
    await otpRecord.deleteOne();

    return ApiResponse.success(res, null, 'Password reset successfully. You can now log in with your new password.');
});

module.exports = {
    registerElder,
    registerVolunteer,
    loginElder,
    loginVolunteer,
    sendOTP,
    verifyOTP,
    sendAadhaarOTP,
    verifyAadhaarOTP,
    forgotPasswordRequest,
    verifyForgotPasswordOTP,
    resetPassword,
};
