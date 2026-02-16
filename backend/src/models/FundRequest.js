const mongoose = require('mongoose');

const fundRequestSchema = new mongoose.Schema({
    experimentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experiment',
        required: true,
    },
    researcherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'CANCELLED'],
        default: 'DRAFT',
    },
    requestedAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    approvedAmount: {
        type: Number, // Set upon approval
    },
    reason: {
        type: String,
        required: true,
    },
    adminDecisionNote: {
        type: String,
    },
    disbursementReferenceId: {
        type: String,
    },
    allocationIdempotencyKey: {
        type: String, // To prevent double allocation
        unique: true,
        sparse: true, // Allow nulls for non-approved requests
    },
    // Timestamps for status changes
    submittedAt: Date,
    reviewedAt: Date,
    decidedAt: Date,
    allocatedAt: Date,
    disbursedAt: Date,
    cancelledAt: Date,
}, {
    timestamps: true
});

// Compound index for finding active requests per experiment
// fundRequestSchema.index({ experimentId: 1, status: 1 });

const FundRequest = mongoose.model('FundRequest', fundRequestSchema);

module.exports = FundRequest;
