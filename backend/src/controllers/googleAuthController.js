const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/constants");
const { setAuthCookie } = require("../utils/authCookie");
const { findOrCreateGoogleUser } = require("../services/googleUser");

const STATE_COOKIE = "google_oauth_state";
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function frontendOrigin() {
  const fallback = process.env.NODE_ENV === "production"
    ? "https://health-lab-black.vercel.app"
    : "http://localhost:5173";
  try {
    const url = new URL(process.env.FRONTEND_URL || fallback);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    return url.origin;
  } catch {
    return fallback;
  }
}

function stateCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  const sameSite = process.env.AUTH_COOKIE_SAME_SITE || (secure ? "none" : "lax");
  return { httpOnly: true, secure, sameSite, path: "/" };
}

function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    const error = new Error("Google sign-in is not configured");
    error.status = 503;
    throw error;
  }
  return { clientId, clientSecret, redirectUri };
}

function oauthClient() {
  const { clientId, clientSecret, redirectUri } = googleConfig();
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

function clearStateCookie(res) {
  res.clearCookie(STATE_COOKIE, stateCookieOptions());
}

function failRedirect(res, code) {
  clearStateCookie(res);
  const url = new URL("/login", frontendOrigin());
  url.searchParams.set("google_error", code);
  return res.redirect(url.toString());
}

function sameSecret(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function homePathFor(user) {
  const role = String(user.role || "").toLowerCase();
  if (role === "admin") return "/admin";
  if (role === "researcher") return "/researcher/experiments";
  return "/experiments";
}

const beginGoogleAuth = (req, res) => {
  try {
    const oauth = oauthClient();
    const state = crypto.randomBytes(32).toString("hex");
    const nonce = crypto.randomBytes(32).toString("hex");
    res.cookie(STATE_COOKIE, `${state}.${nonce}`, { ...stateCookieOptions(), maxAge: STATE_MAX_AGE_MS });
    const url = oauth.generateAuthUrl({
      access_type: "online",
      scope: ["openid", "email", "profile"],
      state,
      nonce,
      prompt: "select_account",
    });
    return res.redirect(url);
  } catch {
    return failRedirect(res, "not_configured");
  }
};

const googleCallback = async (req, res) => {
  const expected = String(req.cookies?.[STATE_COOKIE] || "");
  clearStateCookie(res);
  const [expectedState, expectedNonce] = expected.split(".");
  const code = Array.isArray(req.query.code) ? "" : String(req.query.code || "");
  const state = Array.isArray(req.query.state) ? "" : String(req.query.state || "");

  if (req.query.error || !code || !expectedState || !expectedNonce || !sameSecret(state, expectedState)) {
    return failRedirect(res, "denied");
  }

  try {
    const oauth = oauthClient();
    const { tokens } = await oauth.getToken(code);
    const ticket = await oauth.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !sameSecret(payload.nonce || "", expectedNonce) || payload.email_verified !== true) {
      return failRedirect(res, "unverified");
    }

    const user = await findOrCreateGoogleUser(User, payload);
    if (user.banned === true) return failRedirect(res, "restricted");

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    setAuthCookie(res, token);
    return res.redirect(`${frontendOrigin()}${homePathFor(user)}`);
  } catch (error) {
    return failRedirect(res, error.status === 409 ? "conflict" : "failed");
  }
};

module.exports = { beginGoogleAuth, googleCallback };
