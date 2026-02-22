const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password");

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
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

const roleMiddleware = (allowedRoles = []) => {
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

module.exports = {
  protect,
  requireAuth,
  roleMiddleware,
};
