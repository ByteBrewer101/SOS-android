const Elder = require('../models/Elder');
const SOSLog = require('../models/SOSLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const notificationService = require('../services/notificationService');
const smsService = require('../services/smsService');
const logger = require('../utils/logger');

/**
 * @desc    Trigger SOS emergency alert
 * @route   POST /api/sos/trigger
 * @access  Private (Elder only)
 */
const triggerSOS = asyncHandler(async (req, res) => {
    const { latitude, longitude } = req.body;

    // Get elder details
    const elder = await Elder.findById(req.user._id);
    if (!elder) {
        throw ApiError.notFound('Elder profile not found');
    }

    // Generate Google Maps link
    const locationLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

    // 1. Create SOS log entry
    const sosLog = await SOSLog.create({
        elderId: elder._id,
        elderName: elder.name,
        elderPhone: elder.phone,
        emergencyContactName: elder.emergencyContactName,
        emergencyContactNumber: elder.emergencyContactNumber,
        latitude,
        longitude,
        locationLink,
    });

    logger.info(`🚨 SOS triggered by ${elder.name} (${elder.phone}) at ${latitude}, ${longitude}`);

    // 2. Send SMS to emergency contact
    const smsResult = await smsService.sendSOSAlert(
        elder.emergencyContactNumber,
        elder.name,
        locationLink
    );
    logger.info(`📱 SMS alert sent to emergency contact: ${elder.emergencyContactNumber}`);

    // 3. Send push notifications to selected verified volunteers
    const notifResult = await notificationService.broadcastSOSAlert(
        elder.selectedVolunteers,
        {
            elderName: elder.name,
            elderPhone: elder.phone,
            latitude,
            longitude,
            locationLink,
        }
    );

    // Update the SOS log with notification count
    sosLog.notifiedVolunteers = notifResult.notifiedCount || 0;
    await sosLog.save();

    logger.info(`📢 ${notifResult.notifiedCount || 0} selected volunteers notified`);

    return ApiResponse.success(res, {
        sosId: sosLog._id,
        locationLink,
        emergencyContactNotified: smsResult.success,
        volunteersNotified: notifResult.notifiedCount || 0,
    }, 'SOS alert triggered successfully');
});

/**
 * @desc    Get SOS history for an elder
 * @route   GET /api/sos/logs
 * @access  Private (Elder only)
 */
const getSOSLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const logs = await SOSLog.find({ elderId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await SOSLog.countDocuments({ elderId: req.user._id });

    return ApiResponse.success(res, {
        logs,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
        },
    }, 'SOS logs retrieved successfully');
});

/**
 * @desc    Get a single SOS log by ID
 * @route   GET /api/sos/logs/:id
 * @access  Private
 */
const getSOSLogById = asyncHandler(async (req, res) => {
    const log = await SOSLog.findById(req.params.id);

    if (!log) {
        throw ApiError.notFound('SOS log not found');
    }

    return ApiResponse.success(res, { log }, 'SOS log retrieved successfully');
});

module.exports = {
    triggerSOS,
    getSOSLogs,
    getSOSLogById,
};
