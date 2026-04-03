const mongoose = require("mongoose");
const { db } = require("../config/db");

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    status: { type: String, enum: ["visible", "hidden"], default: "visible" },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    image: { type: String, trim: true, default: null },
    // AI-Based Discussion Categorization (Smart Tagging)
    category: {
      type: String,
      trim: true,
      default: null,
      enum: ["Mental Health", "Nutrition", "Epidemiology", "Public Policy", "Clinical Research", null],
    },
    aiTags: [{ type: String, trim: true }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shareCount: { type: Number, default: 0 },
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
  },
  { timestamps: true, collection: "posts" }
);

postSchema.index({ title: "text", content: "text", tags: "text" });
postSchema.index({ author: 1, createdAt: -1 });

module.exports = db.models.Post || db.model("Post", postSchema);
