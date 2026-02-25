const mongoose = require("mongoose");
const db = require("../config/db");

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorRole: { type: String, required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorRole: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    mediaLinks: [{ type: String, trim: true }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likeCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "hidden", "deleted"],
      default: "active",
    },
    comments: [commentSchema],
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ likeCount: -1 });

const Post = db.userDB.model("Post", postSchema);
console.log(`📁 Model: 'Post' loaded on DB: ${Post.db.name}`);

module.exports = Post;
