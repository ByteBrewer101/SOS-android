const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.AADHAAR_ENCRYPTION_KEY || 'abcdefghijklmnopqrstuvwxyz123456';
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

// Encrypt Aadhaar number
const encryptAadhaar = (aadhaar) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
    let encrypted = cipher.update(aadhaar, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

// Decrypt Aadhaar number (only for internal use)
const decryptAadhaar = (encryptedAadhaar) => {
    const parts = encryptedAadhaar.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

const volunteerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
            match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number'],
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        aadhaarEncrypted: {
            type: String,
            required: [true, 'Aadhaar number is required'],
            select: false,
        },
        aadhaarMasked: {
            type: String,
            required: true,
        },
        aadhaarVerified: {
            type: Boolean,
            default: true,
        },
        isVerified: {
            type: Boolean,
            default: true,
        },
        deviceToken: {
            type: String,
            default: null,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        role: {
            type: String,
            default: 'volunteer',
            immutable: true,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password and encrypt Aadhaar before saving
volunteerSchema.pre('save', async function () {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

// Compare entered password
volunteerSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Remove sensitive data from JSON output
volunteerSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.aadhaarEncrypted;
    delete obj.__v;
    return obj;
};

// Static method to encrypt aadhaar
volunteerSchema.statics.encryptAadhaar = encryptAadhaar;

// Static method to create masked aadhaar (show only last 4 digits)
volunteerSchema.statics.maskAadhaar = (aadhaar) => {
    return 'XXXX-XXXX-' + aadhaar.slice(-4);
};

module.exports = mongoose.model('Volunteer', volunteerSchema);
