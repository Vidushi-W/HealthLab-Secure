const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../config/constants");
const { AUTH_COOKIE_NAME } = require("../utils/authCookie");

const sessionUser = async (req) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) return null;

  const decoded = jwt.verify(token, JWT_SECRET);
  const id = decoded.id || decoded.userId;

  if (!id) throw new Error("Token payload missing ID");

  return User.findById(id).select("-password");
};

const protect = async (req, res, next) => {
  try {
    req.user = await sessionUser(req);

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.banned === true) {
      return res.status(403).json({
        success: false,
        message: "Account access is restricted",
      });
    }

    return next();
  } catch {
    // Do not expose token errors, database details, user IDs,
    // emails, or other internal information to the client.
    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
  }
  next();
};
const authorize = (...args) => {
  const allowedRoles = args.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
    }
    // Authorization must use the authenticated account's persisted role only.
    // Request headers are caller-controlled and must never fill in a missing role.
    const role = req.user.role;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}. Your role: ${role}`,
      });
    }
    next();
  };
};


const optionalAuth = async (req, res, next) => {
  try { req.user = await sessionUser(req); } catch { req.user = null; }
  if (req.user?.banned === true) {
    req.user = null;
    return res.status(403).json({ success: false, message: "Account access is restricted" });
  }
  next();
};
module.exports = { protect, requireAuth, authorize, optionalAuth };
