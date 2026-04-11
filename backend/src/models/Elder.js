const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const elderSchema = new mongoose.Schema(
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
            unique: true,
            trim: true,
            match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number'],
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        emergencyContactName: {
            type: String,
            required: [true, 'Emergency contact name is required'],
            trim: true,
            maxlength: [100, 'Emergency contact name cannot exceed 100 characters'],
        },
        emergencyContactNumber: {
            type: String,
            required: [true, 'Emergency contact number is required'],
            trim: true,
            match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number'],
        },
        deviceToken: {
            type: String,
            default: null,
        },
        selectedVolunteers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Volunteer',
        }],
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        role: {
            type: String,
            default: 'elder',
            immutable: true,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
elderSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
elderSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Remove sensitive data from JSON output
elderSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('Elder', elderSchema);
