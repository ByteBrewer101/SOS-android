const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
    {
        phone: {
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
            enum: ['phone', 'aadhaar'],
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
otpSchema.index({ phone: 1, type: 1 });

module.exports = mongoose.model('OTP', otpSchema);
