const mongoose = require("mongoose");
const db = require("../config/db");

const reportSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ["post", "comment"], required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    commentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ["pending", "resolved"], default: "pending" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ postId: 1, targetType: 1 });

const Report = db.userDB.model("Report", reportSchema);
console.log(`📁 Model: 'Report' loaded on DB: ${Report.db.name}`);

module.exports = Report;
