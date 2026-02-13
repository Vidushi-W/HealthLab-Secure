const mongoose = require("mongoose");

const experimentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    status: {
      type: String,
      enum: ["draft", "active", "closed"],
      default: "draft",
    },

    // keep these for later auth integration
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    coResearchers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    eligibilityRules: { type: Object, default: {} },
    participantLimit: { type: Number, default: 0 },

    publishedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Experiment", experimentSchema);
