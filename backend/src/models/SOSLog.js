const mongoose = require('mongoose');

const sosLogSchema = new mongoose.Schema(
    {
        elderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Elder',
            required: [true, 'Elder ID is required'],
        },
        elderName: {
            type: String,
            required: true,
        },
        elderPhone: {
            type: String,
            required: true,
        },
        emergencyContactName: {
            type: String,
            required: true,
        },
        emergencyContactNumber: {
            type: String,
            required: true,
        },
        latitude: {
            type: Number,
            required: [true, 'Latitude is required'],
            min: [-90, 'Invalid latitude'],
            max: [90, 'Invalid latitude'],
        },
        longitude: {
            type: Number,
            required: [true, 'Longitude is required'],
            min: [-180, 'Invalid longitude'],
            max: [180, 'Invalid longitude'],
        },
        locationLink: {
            type: String,
        },
        notifiedVolunteers: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['triggered', 'acknowledged', 'resolved'],
            default: 'triggered',
        },
    },
    {
        timestamps: true,
    }
);

// Generate Google Maps link before saving
sosLogSchema.pre('save', function () {
    if (this.latitude && this.longitude) {
        this.locationLink = `https://www.google.com/maps?q=${this.latitude},${this.longitude}`;
    }
});

// Index for efficient queries
sosLogSchema.index({ elderId: 1, createdAt: -1 });
sosLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SOSLog', sosLogSchema);
