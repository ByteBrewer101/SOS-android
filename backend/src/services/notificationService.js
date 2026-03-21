const Volunteer = require('../models/Volunteer');
const logger = require('../utils/logger');
const sseManager = require('./sseManager');

/**
 * Send push notification to a single device (stubbed - Firebase disabled)
 */
const sendToDevice = async (deviceToken, title, body, data = {}) => {
    logger.info(`📢 [STUB] Push notification to device: ${title} - ${body}`);
    return { success: true, reason: 'Notifications stubbed (Firebase disabled)' };
};

/**
 * Broadcast SOS alert to selected verified volunteers
 * - Sends real-time SSE events to connected volunteers
 * - Falls back to stub logging for push notifications (Firebase disabled)
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

    // Send real-time SSE notification to connected volunteers
    const ssePayload = {
        type: 'sos_alert',
        elderName,
        elderPhone,
        latitude,
        longitude,
        locationLink,
        timestamp: new Date().toISOString(),
    };

    const sseNotified = sseManager.broadcastToVolunteers(
        selectedVolunteerIds.map(id => id.toString()),
        'sos_alert',
        ssePayload
    );

    logger.info(`📢 SSE real-time notification sent to ${sseNotified} connected volunteers`);
    logger.info(`📢 Elder: ${elderName} (${elderPhone}) at ${latitude}, ${longitude}`);
    logger.info(`📢 Location: ${locationLink}`);

    return {
        notifiedCount: volunteers.length,
        sseNotifiedCount: sseNotified,
        volunteers: volunteers.map((v) => v.name),
    };
};

module.exports = {
    sendToDevice,
    broadcastSOSAlert,
};
