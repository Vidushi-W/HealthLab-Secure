const mongoose = require("mongoose");
const db = require("../config/db");

const experimentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, default: 'draft' },
  eligibilityRules: { type: Object, default: {} },
  participantLimit: { type: Number, default: 0 },
  currentParticipants: { type: Number, default: 0 },
  // Fields observed in user's screenshot
  publishedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null },
}, {
  timestamps: true,
  collection: 'experiments' // Force lowercase plural to match screenshot exactly
});

// Use a getter approach for multi-db compatibility
const experimentModel = db.experimentDB.model("Experiment", experimentSchema);
console.log(`📁 Model: 'Experiment' initialized on DB: ${experimentModel.db.name} (Coll: ${experimentModel.collection.name})`);

module.exports = experimentModel;
