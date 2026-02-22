const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET, HTTP_STATUS } = require("../config/constants");

/**
 * Optional auth: sets req.user if valid token, otherwise req.user = null. Never 401.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      req.user = null;
      return next();
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("_id name email role");
    req.user = user || null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

/**
 * Required auth: returns 401 if no valid token. Sets req.user.
 */
const requiredAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Authentication required" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("_id name email role");
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Invalid token" });
    }
    next(err);
  }
};

module.exports = {
  optionalAuth,
  requiredAuth,
  JWT_SECRET,
};
