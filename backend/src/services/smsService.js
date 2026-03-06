const logger = require('../utils/logger');

/**
 * Send SMS to a phone number (stubbed - SMS gateway not configured)
 * In production, integrate with an SMS gateway (Twilio, MSG91, Fast2SMS, etc.)
 */
const sendSMS = async (phoneNumber, message) => {
    logger.info(`📱 [STUB] SMS to +91${phoneNumber}: ${message}`);
    return { success: true, message: 'SMS logged (SMS gateway disabled)' };
};

/**
 * Send SOS emergency SMS to emergency contact (stubbed)
 */
const sendSOSAlert = async (emergencyContactNumber, elderName, locationLink) => {
    const message = `🚨 SOS ALERT! ${elderName} needs emergency help! Location: ${locationLink}. Please respond immediately.`;
    return await sendSMS(emergencyContactNumber, message);
};

module.exports = {
    sendSMS,
    sendSOSAlert,
};
