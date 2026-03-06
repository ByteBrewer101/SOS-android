const Volunteer = require('../models/Volunteer');
const SOSLog = require('../models/SOSLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Get volunteer profile
 * @route   GET /api/volunteer/profile
 * @access  Private (Volunteer only)
 */
const getProfile = asyncHandler(async (req, res) => {
    const volunteer = await Volunteer.findById(req.user._id);

    if (!volunteer) {
        throw ApiError.notFound('Volunteer profile not found');
    }

    return ApiResponse.success(res, { user: volunteer }, 'Profile retrieved successfully');
});

/**
 * @desc    Update volunteer device token
 * @route   PUT /api/volunteer/device-token
 * @access  Private (Volunteer only)
 */
const updateDeviceToken = asyncHandler(async (req, res) => {
    const { deviceToken } = req.body;

    const volunteer = await Volunteer.findByIdAndUpdate(
        req.user._id,
        { deviceToken },
        { new: true }
    );

    if (!volunteer) {
        throw ApiError.notFound('Volunteer profile not found');
    }

    return ApiResponse.success(res, null, 'Device token updated successfully');
});

/**
 * @desc    Get recent SOS alerts for volunteer
 * @route   GET /api/volunteer/alerts
 * @access  Private (Volunteer only)
 */
const getAlerts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const alerts = await SOSLog.find()
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await SOSLog.countDocuments();

    return ApiResponse.success(res, {
        alerts,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
        },
    }, 'Alerts retrieved successfully');
});

module.exports = {
    getProfile,
    updateDeviceToken,
    getAlerts,
};
