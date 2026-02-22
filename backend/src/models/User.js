const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Basic profile
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // Auth
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // don't return password in queries by default
    },

    // RBAC
    role: {
      type: String,
      enum: ["participant", "researcher", "admin", "medical_reviewer"],
      default: "participant",
      required: true,
    },

    // Optional: Participant / enrollment fields (keep optional to avoid breaking existing users)
    age: { type: Number },

    gender: {
      type: String,
      enum: ["Male", "Female", "Non-binary", "Other", "Prefer not to say"],
      default: "Prefer not to say",
    },
    location: { type: String, default: "Prefer not to say" },

    // Health Metrics
    height: { type: Number }, // cm
    weight: { type: Number }, // kg
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
      default: "Unknown",
    },

    // Medical History
    medicalConditions: [{ type: String }],
    medications: [{ type: String }],

    // Lifestyle
    smokingStatus: {
      type: String,
      enum: ["Never", "Former", "Current", "Prefer not to say"],
      default: "Prefer not to say",
    },
    alcoholStatus: {
      type: String,
      enum: ["Never", "Occasional", "Regular", "Prefer not to say"],
      default: "Prefer not to say",
    },
    sleepPatterns: {
      type: String,
      default: "Unknown",
    },
    activityLevel: {
      type: String,
      enum: ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Prefer not to say"],
      default: "Prefer not to say",
    },

    // For researchers: experiments they created
    researchesCreated: [{ type: mongoose.Schema.Types.ObjectId, ref: "Experiment" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);