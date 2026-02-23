const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 150,
    },
    abstract: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 2000,
    },
    content: {
      type: String,
      required: true,
    },
    keywords: {
      type: [String],
      default: [],
      validate: {
        validator(v) {
          return v.every((k) => typeof k === "string" && k.length <= 50);
        },
        message: "Keywords must be strings, max 50 chars each",
      },
    },
    experiment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experiment",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Set publishedAt when status becomes published
reviewSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

const { experimentDB } = require("../config/db");
module.exports = experimentDB.model("Review", reviewSchema);
