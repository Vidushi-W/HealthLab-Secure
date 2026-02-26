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

// Add matchPassword method to schema
userSchema.methods.matchPassword = async function (enteredPassword) {
  const bcrypt = require("bcryptjs");
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save hook for password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const bcrypt = require("bcryptjs");
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Register on userDB (primary)
const userModel = db.userDB.model("User", userSchema);
console.log(`📁 Model: 'User' loaded on DB: ${userModel.db.name}`);

// Also register on experimentDB so FundRequest.populate('researcherId') works
// (FundRequest lives on experimentDB and uses ref: 'User')
if (!db.experimentDB.models["User"]) {
  db.experimentDB.model("User", userSchema);
  console.log(`📁 Model: 'User' also registered on experimentDB for cross-DB populate`);
}

module.exports = userModel;
