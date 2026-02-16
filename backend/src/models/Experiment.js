const mongoose = require('mongoose');

const experimentSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    fundingTargetAmount: {
        type: Number,
        required: true,
    },
    minTopUpAmount: {
        type: Number,
        default: 0,
    },
    maxTopUpAmount: {
        type: Number,
        default: 1000000,
    },
    maxTotalTopUps: {
        type: Number,
        // Optional cap on sum of approved funds
    },
    currency: {
        type: String,
        default: 'USD',
    }
}, {
    timestamps: true
});

const Experiment = mongoose.model('Experiment', experimentSchema);

module.exports = Experiment;
