const mongoose = require("mongoose");

const participationSchema = new mongoose.Schema(
  {
    // User info (you'll add User model later)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userAge: { type: Number, required: true }, // Store age for protocol checks
    userEmail: { type: String, required: true }, // Store email for identification

    // Link to experiment
    experimentId: { type: mongoose.Schema.Types.ObjectId, ref: "Experiment", required: true },

    // Lifecycle status
    status: {
      type: String,
      enum: ["joined", "dropped", "completed"],
      default: "joined",
    },

    dateJoined: { type: Date, default: Date.now },
    dateLeft: { type: Date, default: null },

    // ANONYMIZATION: Hide PII when user withdraws
    isAnonymized: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index to prevent duplicates for same user in same experiment
participationSchema.index({ userId: 1, experimentId: 1 }, { unique: true });

const { userDB } = require("../config/db");

module.exports = userDB.model("Participation", participationSchema);
