const mongoose = require("mongoose");

/**
 * Placeholder auth: reads user from headers (X-User-Id, X-User-Role).
 * Replace with JWT/session middleware when you add real auth.
 * req.user = { id: ObjectId, role: 'researcher'|'admin' }
 */
const requireAuth = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  const role = req.headers["x-user-role"];

  if (!userId || !role) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      success: false,
      message: "Invalid user id",
    });
  }

  const allowedRoles = ["researcher", "admin"];
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      success: false,
      message: "Invalid role",
    });
  }

  req.user = { id: new mongoose.Types.ObjectId(userId), role };
  next();
};

/** Require one of the given roles (use after requireAuth). */
const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions",
    });
  }
  next();
};

/** Require that req.user.id equals authorId (ObjectId) or user is admin. Use after requireAuth. */
const requireAuthorOrAdmin = (authorId) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  const isAdmin = req.user.role === "admin";
  const isAuthor = authorId && req.user.id.equals(authorId);
  if (isAdmin || isAuthor) return next();
  return res.status(403).json({
    success: false,
    message: "Only the author or an admin can perform this action",
  });
};

/**
 * Optional auth: if X-User-Id and X-User-Role are present, set req.user.
 * Does not return 401 if missing. Use for read endpoints that allow anonymous access.
 */
const optionalAuth = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  const role = req.headers["x-user-role"];
  if (!userId || !role) return next();
  if (!mongoose.Types.ObjectId.isValid(userId) || !["researcher", "admin"].includes(role)) {
    return next();
  }
  req.user = { id: new mongoose.Types.ObjectId(userId), role };
  next();
};

module.exports = {
  requireAuth,
  requireRole,
  requireAuthorOrAdmin,
  optionalAuth,
};
