const Elder = require('../models/Elder');
const Volunteer = require('../models/Volunteer');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Get elder profile
 * @route   GET /api/elder/profile
 * @access  Private (Elder only)
 */
const getProfile = asyncHandler(async (req, res) => {
    const elder = await Elder.findById(req.user._id).populate('selectedVolunteers', 'name phone');

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

/**
 * @desc    Get available verified volunteers
 * @route   GET /api/elder/volunteers
 * @access  Private (Elder only)
 */
const getVolunteers = asyncHandler(async (req, res) => {
    const volunteers = await Volunteer.find({ isVerified: true })
        .select('name phone')
        .sort({ createdAt: -1 });

    return ApiResponse.success(res, { volunteers }, 'Volunteers retrieved successfully');
});

/**
 * @desc    Select volunteers for SOS
 * @route   POST /api/elder/volunteers
 * @access  Private (Elder only)
 */
const selectVolunteers = asyncHandler(async (req, res) => {
    const { volunteerIds } = req.body;

    if (!Array.isArray(volunteerIds) || volunteerIds.length < 2) {
        throw ApiError.badRequest('You must select at least 2 volunteers');
    }

    // Verify all IDs exist and are verified volunteers
    const verifiedVolunteers = await Volunteer.find({
        _id: { $in: volunteerIds },
        isVerified: true
    });

    if (verifiedVolunteers.length !== volunteerIds.length) {
        throw ApiError.badRequest('Some selected volunteers are invalid or not verified');
    }

    const elder = await Elder.findByIdAndUpdate(
        req.user._id,
        { selectedVolunteers: volunteerIds },
        { new: true }
    ).populate('selectedVolunteers', 'name phone');

    return ApiResponse.success(res, { user: elder }, 'Volunteers selected successfully');
});

module.exports = {
    getProfile,
    updateProfile,
    updateDeviceToken,
    getVolunteers,
    selectVolunteers,
};
