function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find an existing account by Google subject or email, or register a participant.
 * Email linking only happens for the verified address returned by Google.
 */
async function findOrCreateGoogleUser(UserModel, profile) {
  const googleId = String(profile.sub || "").trim();
  const email = String(profile.email || "").trim().toLowerCase();
  const name = String(profile.name || email.split("@")[0] || "Google user").trim().slice(0, 120);

  if (!googleId || !email) {
    const error = new Error("Google account did not include an email");
    error.status = 400;
    throw error;
  }

  const byGoogleId = await UserModel.findOne({ google_id: googleId });
  if (byGoogleId) return byGoogleId;

  const byEmail = await UserModel.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") },
  });

  if (byEmail) {
    if (byEmail.google_id && byEmail.google_id !== googleId) {
      const error = new Error("This email is already linked to a different Google account");
      error.status = 409;
      throw error;
    }
    byEmail.google_id = googleId;
    await byEmail.save();
    return byEmail;
  }

  return UserModel.create({
    name,
    email,
    google_id: googleId,
    role: "participant",
  });
}

module.exports = { findOrCreateGoogleUser };
