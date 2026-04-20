const nodemailer = require('nodemailer');
const OTP = require('../models/OTP');
const logger = require('../utils/logger');
const Elder = require('../models/Elder');
const Volunteer = require('../models/Volunteer');

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

// Configure NodeMailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'no-reply@sosapp.com', // Use your email
        pass: process.env.SMTP_PASS || 'password123', // Use your password or app password
    },
});

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via Email (Nodemailer)
 */
const sendEmailOTP = async (email) => {
    // Delete any existing OTP for this email
    await OTP.deleteMany({ email, type: 'email' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OTP.create({
        email,
        otp,
        type: 'email',
        expiresAt,
    });

    try {
        // Send actual email using nodemailer
        const mailOptions = {
            from: `"SOS Emergency App" <${process.env.SMTP_USER || 'no-reply@sosapp.com'}>`,
            to: email,
            subject: 'Your SOS App Verification Code',
            text: `Your SOS App verification code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
            html: `<h3>Welcome to SOS Emergency App</h3>
                   <p>Your verification code is: <strong>${otp}</strong></p>
                   <p>This code is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>`,
        };

        if (process.env.SMTP_USER) {
            await transporter.sendMail(mailOptions);
            logger.info(`📧 Email OTP sent to ${email}`);
        } else {
            logger.warn(`📧 SMTP_USER not configured. OTP for ${email}: ${otp}`);
        }
    } catch (error) {
        logger.error(`Error sending email OTP to ${email}: ${error.message}`);
        // In local development, we don't throw to allow testing OTP easily via console logs.
    }

    return { message: 'OTP sent successfully to your email', expiresInMinutes: OTP_EXPIRY_MINUTES };
};

/**
 * Verify email OTP
 */
const verifyEmailOTP = async (email, userOtp) => {
    const otpRecord = await OTP.findOne({
        email,
        type: 'email',
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
    await OTP.deleteMany({ email: aadhaarNumber, type: 'aadhaar' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OTP.create({
        email: aadhaarNumber, // Using email field to store aadhaar for OTP lookup
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
        email: aadhaarNumber,
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

/**
 * Send Forgot Password OTP via Email
 * Only sends if the email is registered to an elder or volunteer
 */
const sendForgotPasswordOTP = async (email) => {
    // Verify email belongs to a registered user
    const elder = await Elder.findOne({ email });
    const volunteer = await Volunteer.findOne({ email });

    if (!elder && !volunteer) {
        // Return a generic success-looking message for security (don't reveal if email exists)
        logger.warn(`Forgot password OTP requested for unregistered email: ${email}`);
        return {
            message: 'If this email is registered, an OTP has been sent.',
            expiresInMinutes: OTP_EXPIRY_MINUTES,
            registered: false,
        };
    }

    // Delete any existing forgot_password OTPs for this email
    await OTP.deleteMany({ email, type: 'forgot_password' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OTP.create({
        email,
        otp,
        type: 'forgot_password',
        expiresAt,
    });

    try {
        const mailOptions = {
            from: `"SOS Emergency App" <${process.env.SMTP_USER || 'no-reply@sosapp.com'}>`,
            to: email,
            subject: 'SOS App — Password Reset Code',
            text: `Your SOS App password reset code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. If you did not request this, please ignore this email.`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px;">
                    <h2 style="color:#1E3A5F;margin-bottom:8px;">Password Reset Request</h2>
                    <p style="color:#666;">We received a request to reset your SOS App password.</p>
                    <div style="background:#F8F6F0;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
                        <p style="color:#999;font-size:14px;margin:0 0 8px;">Your one-time password reset code</p>
                        <h1 style="color:#E67E22;font-size:40px;letter-spacing:8px;margin:0;">${otp}</h1>
                    </div>
                    <p style="color:#666;font-size:13px;">This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
                    <p style="color:#999;font-size:12px;">If you did not request a password reset, please ignore this email.</p>
                </div>
            `,
        };

        if (process.env.SMTP_USER) {
            await transporter.sendMail(mailOptions);
            logger.info(`🔑 Password reset OTP sent to ${email}`);
        } else {
            logger.warn(`🔑 SMTP_USER not configured. Password reset OTP for ${email}: ${otp}`);
        }
    } catch (error) {
        logger.error(`Error sending forgot password OTP to ${email}: ${error.message}`);
    }

    return {
        message: 'If this email is registered, an OTP has been sent.',
        expiresInMinutes: OTP_EXPIRY_MINUTES,
        registered: true,
    };
};

/**
 * Verify Forgot Password OTP
 * Returns a short-lived reset token on success
 */
const verifyForgotPasswordOTP = async (email, userOtp) => {
    const otpRecord = await OTP.findOne({
        email,
        type: 'forgot_password',
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

    // Mark as verified — grants permission to reset password
    otpRecord.verified = true;
    await otpRecord.save();

    return { success: true, message: 'OTP verified. You can now reset your password.' };
};

module.exports = {
    sendEmailOTP,
    verifyEmailOTP,
    sendAadhaarOTP,
    verifyAadhaarOTP,
    generateOTP,
    sendForgotPasswordOTP,
    verifyForgotPasswordOTP,
};
