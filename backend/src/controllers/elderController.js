const Elder = require('../models/Elder');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Get elder profile
 * @route   GET /api/elder/profile
 * @access  Private (Elder only)
 */
const getProfile = asyncHandler(async (req, res) => {
    const elder = await Elder.findById(req.user._id);

    if (!elder) {
        throw ApiError.notFound('Elder profile not found');
    }

    return ApiResponse.success(res, { user: elder }, 'Profile retrieved successfully');
});

/**
 * @desc    Update elder profile
 * @route   PUT /api/elder/profile
 * @access  Private (Elder only)
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { name, emergencyContactName, emergencyContactNumber } = req.body;

    const elder = await Elder.findById(req.user._id);

    if (!elder) {
        throw ApiError.notFound('Elder profile not found');
    }

    // Update only provided fields
    if (name) elder.name = name;
    if (emergencyContactName) elder.emergencyContactName = emergencyContactName;
    if (emergencyContactNumber) elder.emergencyContactNumber = emergencyContactNumber;

    await elder.save();

    return ApiResponse.success(res, { user: elder }, 'Profile updated successfully');
});

/**
 * @desc    Update elder device token (for push notifications)
 * @route   PUT /api/elder/device-token
 * @access  Private (Elder only)
 */
const updateDeviceToken = asyncHandler(async (req, res) => {
    const { deviceToken } = req.body;

    const elder = await Elder.findByIdAndUpdate(
        req.user._id,
        { deviceToken },
        { new: true }
    );

    if (!elder) {
        throw ApiError.notFound('Elder profile not found');
    }

    return ApiResponse.success(res, null, 'Device token updated successfully');
});

module.exports = {
    getProfile,
    updateProfile,
    updateDeviceToken,
};
