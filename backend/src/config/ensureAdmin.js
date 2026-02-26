/**
 * Ensures default admin exists with permanent credentials.
 * Runs once on server boot so admin@healthlab.com / admin123 always work.
 */
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const ADMIN_EMAIL = "admin@healthlab.com";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "System Admin";

async function ensureAdmin() {
  try {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const existing = await User.findOne({ email: ADMIN_EMAIL }).select("+password");
    if (existing) {
      existing.password = hash;
      existing.name = ADMIN_NAME;
      existing.role = "admin";
      await existing.save();
      console.log("✅ Admin: credentials set for", ADMIN_EMAIL);
    } else {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hash,
        role: "admin",
        isApproved: true,
      });
      console.log("✅ Admin: created", ADMIN_EMAIL, "with password", ADMIN_PASSWORD);
    }
  } catch (err) {
    console.error("❌ Admin: ensure failed", err.message);
  }
}

module.exports = { ensureAdmin };
