const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
        },
        otp: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['email', 'aadhaar', 'forgot_password'],
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index - auto-delete expired OTPs
        },
        verified: {
            type: Boolean,
            default: false,
        },
        attempts: {
            type: Number,
            default: 0,
            max: [5, 'Maximum OTP verification attempts exceeded'],
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient OTP lookups
otpSchema.index({ email: 1, type: 1 });

module.exports = mongoose.model('OTP', otpSchema);
