const mongoose = require("mongoose");
const { db } = require("../config/db");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // Local accounts require a password. Google accounts are identified by google_id instead.
  password: {
    type: String,
    required: function passwordRequired() {
      return !this.google_id;
    },
    select: false,
  },
  google_id: { type: String, unique: true, sparse: true },
  role: { type: String, default: "participant" },
  isApproved: { type: Boolean, default: false },
  banned: { type: Boolean, default: false },
  age: Number,
  gender: String,
  location: String,
  height: Number,
  weight: Number,
  bloodGroup: String,
  medicalConditions: [String],
  medications: [String],
  smokingStatus: String,
  alcoholStatus: String,
  sleepPatterns: String,
  activityLevel: String,
  bmi: Number,
}, { timestamps: true });

// Add matchPassword method to schema
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  const bcrypt = require("bcryptjs");
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save hook for password hashing and BMI calculation
userSchema.pre("save", async function () {
  // Hash password if modified
  if (this.isModified("password") && this.password) {
    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Calculate BMI if height and weight are provided
  if (this.height && this.weight) {
    const heightInMeters = this.height / 100;
    this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
});

// Register on userDB (primary)
const userModel = db.models.User || db.model("User", userSchema);
console.log(`📁 Model: 'User' loaded on DB: ${userModel.db.name}`);

module.exports = userModel;
