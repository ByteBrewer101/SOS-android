const OTP = require('../models/OTP');
const logger = require('../utils/logger');

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via SMS
 * In production, integrate with SMS gateway (Twilio, MSG91, Fast2SMS, etc.)
 */
const sendPhoneOTP = async (phone) => {
    // Delete any existing OTP for this phone
    await OTP.deleteMany({ phone, type: 'phone' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OTP.create({
        phone,
        otp,
        type: 'phone',
        expiresAt,
    });

    // TODO: Integrate with actual SMS gateway
    // For development, log the OTP
    logger.info(`📱 [DEV] Phone OTP for ${phone}: ${otp}`);

    // Example SMS gateway integration:
    // await smsGateway.send({
    //   to: `+91${phone}`,
    //   message: `Your SOS App verification code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
    // });

    return { message: 'OTP sent successfully', expiresInMinutes: OTP_EXPIRY_MINUTES };
};

/**
 * Verify phone OTP
 */
const verifyPhoneOTP = async (phone, userOtp) => {
    const otpRecord = await OTP.findOne({
        phone,
        type: 'phone',
        verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
        return { success: false, message: 'No OTP found. Please request a new one.' };
    }

    if (otpRecord.expiresAt < new Date()) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return { success: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.' };
    }

    if (otpRecord.otp !== userOtp) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        return {
            success: false,
            message: `Invalid OTP. ${MAX_ATTEMPTS - otpRecord.attempts} attempts remaining.`,
        };
    }

    // OTP is valid
    otpRecord.verified = true;
    await otpRecord.save();

    return { success: true, message: 'OTP verified successfully' };
};

/**
 * Send Aadhaar OTP
 * In production, integrate with UIDAI Aadhaar OTP API
 */
const sendAadhaarOTP = async (aadhaarNumber) => {
    // Delete any existing Aadhaar OTP
    await OTP.deleteMany({ phone: aadhaarNumber, type: 'aadhaar' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OTP.create({
        phone: aadhaarNumber, // Using phone field to store aadhaar for OTP lookup
        otp,
        type: 'aadhaar',
        expiresAt,
    });

    // TODO: Integrate with UIDAI Aadhaar OTP API
    // In production, trigger Aadhaar OTP via official API
    logger.info(`🔐 [DEV] Aadhaar OTP for ${aadhaarNumber.slice(-4)}: ${otp}`);

    return { message: 'Aadhaar OTP sent successfully', expiresInMinutes: OTP_EXPIRY_MINUTES };
};

/**
 * Verify Aadhaar OTP
 */
const verifyAadhaarOTP = async (aadhaarNumber, userOtp) => {
    const otpRecord = await OTP.findOne({
        phone: aadhaarNumber,
        type: 'aadhaar',
        verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
        return { success: false, message: 'No Aadhaar OTP found. Please request a new one.' };
    }

    if (otpRecord.expiresAt < new Date()) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return { success: false, message: 'Aadhaar OTP has expired. Please request a new one.' };
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return { success: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.' };
    }

    if (otpRecord.otp !== userOtp) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        return {
            success: false,
            message: `Invalid OTP. ${MAX_ATTEMPTS - otpRecord.attempts} attempts remaining.`,
        };
    }

    // OTP is valid
    otpRecord.verified = true;
    await otpRecord.save();

    return { success: true, message: 'Aadhaar OTP verified successfully' };
};

module.exports = {
    sendPhoneOTP,
    verifyPhoneOTP,
    sendAadhaarOTP,
    verifyAadhaarOTP,
    generateOTP,
};
