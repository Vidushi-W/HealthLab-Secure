const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../config/constants");

// Information-leakage fix for login checks.
// protect runs on every request that carries a login token.
// The old version wrote the user's email, id, database name, and health
// profile (gender, age, BMI, activity, sleep, smoking) to the server log.
// It also wrote the full Authorization header, which can hold the token.
// A failed check returned the database name and the raw token error
// (for example "jwt malformed") in the HTTP body.
// Those values stay on the server now. The client gets a fixed message,
// and this function does not print health data, emails, or tokens.
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const id = decoded.id || decoded.userId;
    if (!id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    req.user = await User.findById(id).select("-password");
    // The same message is used when the user record is missing, so the
    // response does not include the database name or the user id.
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    return next();
  } catch {
    // A bad or expired token stays a generic 401. error.message is not returned.
    return res.status(401).json({ message: "Not authorized" });
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
    const role = req.user.role || req.headers["x-user-role"];
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
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      req.user = null;
      return next();
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id name email role");
    req.user = user || null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = {
  protect,
  requireAuth,
  authorize,
  optionalAuth,
};
