const mongoose = require('mongoose');

const experimentWalletSchema = new mongoose.Schema({
    experimentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experiment',
        required: true,
        unique: true,
    },
    currency: {
        type: String,
        default: 'USD',
    },
    balance: {
        type: Number,
        default: 0,
    },
    lastUpdatedAt: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true
});

const ExperimentWallet = mongoose.model('ExperimentWallet', experimentWalletSchema);

module.exports = ExperimentWallet;
