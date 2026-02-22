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

    // keep this for later auth integration
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    coResearchers: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 80,
          },
          email: {
            type: String,
            trim: true,
            lowercase: true,
            validate: {
              validator: (v) =>
                !v ||
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
              message: "Invalid co-researcher email format",
            },
          },
          role: {
            type: String,
            trim: true,
            default: "co-researcher",
          },
          addedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
      validate: {
        validator(value) {
          if (!Array.isArray(value)) return false;

          const seen = new Set();
          for (const item of value) {
            if (!item) continue;

            const email =
              typeof item.email === "string"
                ? item.email.trim().toLowerCase()
                : "";
            const name =
              typeof item.name === "string"
                ? item.name.trim().toLowerCase()
                : "";

            // Prefer email for uniqueness when present, otherwise use name
            const key = email || (name ? `name:${name}` : null);
            if (!key) continue;

            if (seen.has(key)) {
              return false;
            }
            seen.add(key);
          }

          return true;
        },
        message:
          "Duplicate co-researcher by email or (when email missing) by name is not allowed",
      },
    },

    eligibilityRules: {
      type: Object,
      default: {},
    },
    participantLimit: { type: Number, default: 0 },
    // Track current number of active participants for atomic capacity checks
    currentParticipants: { type: Number, default: 0 },

    publishedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Experiment", experimentSchema);
