const Volunteer = require('../models/Volunteer');
const logger = require('../utils/logger');

/**
 * Send push notification to a single device (stubbed - Firebase disabled)
 */
const sendToDevice = async (deviceToken, title, body, data = {}) => {
    logger.info(`📢 [STUB] Push notification to device: ${title} - ${body}`);
    return { success: true, reason: 'Notifications stubbed (Firebase disabled)' };
};

/**
 * Broadcast SOS alert to selected verified volunteers (stubbed - Firebase disabled)
 */
const broadcastSOSAlert = async (selectedVolunteerIds, sosData) => {
    const { elderName, elderPhone, latitude, longitude, locationLink } = sosData;

    // Find verified volunteers from the selected list
    const volunteers = await Volunteer.find({
        _id: { $in: selectedVolunteerIds },
        isVerified: true,
    }).select('name');

    if (volunteers.length === 0) {
        logger.warn('⚠️  No selected verified volunteers found');
        return { notifiedCount: 0, volunteers: [] };
    }

    logger.info(`📢 [STUB] Would broadcast SOS to ${volunteers.length} selected volunteers`);
    logger.info(`📢 [STUB] Elder: ${elderName} (${elderPhone}) at ${latitude}, ${longitude}`);
    logger.info(`📢 [STUB] Location: ${locationLink}`);

    return {
        notifiedCount: volunteers.length,
        volunteers: volunteers.map((v) => v.name),
    };
};

module.exports = {
    sendToDevice,
    broadcastSOSAlert,
};
