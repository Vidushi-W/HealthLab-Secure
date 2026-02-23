const mongoose = require("mongoose");
const db = require("../config/db");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: "participant" },
  isApproved: { type: Boolean, default: false },
  age: Number,
  medicalConditions: [String],
  activityLevel: String,
  // Add other fields as needed for recommendations
}, { timestamps: true });

const userModel = db.userDB.model("User", userSchema);
console.log(`📁 Model: 'User' loaded on DB: ${userModel.db.name}`);

module.exports = userModel;
