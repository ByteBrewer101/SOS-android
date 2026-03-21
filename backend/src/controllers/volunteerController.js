const Volunteer = require('../models/Volunteer');
const Elder = require('../models/Elder');
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
 * @desc    Get recent SOS alerts for volunteer (only from elders who selected this volunteer)
 * @route   GET /api/volunteer/alerts
 * @access  Private (Volunteer only)
 */
const getAlerts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    // Find all elders who have selected this volunteer
    const elders = await Elder.find({
        selectedVolunteers: req.user._id,
    }).select('_id');

    const elderIds = elders.map((e) => e._id);

    // Only return SOS logs from elders who selected this volunteer
    const query = { elderId: { $in: elderIds } };

    const alerts = await SOSLog.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await SOSLog.countDocuments(query);

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
