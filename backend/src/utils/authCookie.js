const jwt = require("jsonwebtoken");
const AUTH_COOKIE_NAME = "healthlab_session";
const cookieOptions = () => {
  const secure = process.env.NODE_ENV === "production";
  // The documented Vercel frontend and Render API are cross-site in production.
  const sameSite = process.env.AUTH_COOKIE_SAME_SITE || (secure ? "none" : "lax");
  if (!["lax", "strict", "none"].includes(sameSite) || (sameSite === "none" && !secure)) {
    throw new Error("AUTH_COOKIE_SAME_SITE must be lax/strict, or none with NODE_ENV=production (HTTPS)");
  }
  return { httpOnly: true, secure, sameSite, path: "/" };
};
const setAuthCookie = (res, token) => {
  // Use the exact expiry of the JWT signed by this server.
  const { exp } = jwt.decode(token);
  res.cookie(AUTH_COOKIE_NAME, token, { ...cookieOptions(), expires: new Date(exp * 1000) });
  res.set("Cache-Control", "no-store");
};
const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions());
  res.set("Cache-Control", "no-store");
};
module.exports = { AUTH_COOKIE_NAME, setAuthCookie, clearAuthCookie };
