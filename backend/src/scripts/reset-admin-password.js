/**
 * One-time script: set admin@healthlab.com password to "admin123".
 * Run: node src/scripts/reset-admin-password.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');

const ADMIN_EMAIL = 'admin@healthlab.com';
const NEW_PASSWORD = 'admin123';

async function reset() {
  await connectDB();
  const user = await User.findOne({ email: ADMIN_EMAIL }).select('+password');
  if (!user) {
    console.error('No user found with email:', ADMIN_EMAIL);
    process.exit(1);
  }
  const hash = await bcrypt.hash(NEW_PASSWORD, 12);
  user.password = hash;
  await user.save();
  console.log('Password updated for', ADMIN_EMAIL);
  console.log('You can now log in with password:', NEW_PASSWORD);
  process.exit(0);
}

reset().catch((err) => {
  console.error(err);
  process.exit(1);
});
