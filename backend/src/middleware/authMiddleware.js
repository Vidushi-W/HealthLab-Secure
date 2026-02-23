const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../config/constants");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from the token - handle both 'id' and 'userId' for compatibility
      const id = decoded.id || decoded.userId;
      if (!id) {
        console.log("❌ Auth: No id/userId found in token");
        return res.status(401).json({ message: "Not authorized. Token payload missing ID." });
      }

      console.log(`⏳ Auth: Looking up user ${id} in ${User.db.name}...`);
      req.user = await User.findById(id).select("-password");

      if (!req.user) {
        console.log(`❌ Auth: User ${id} not found in ${User.db.name}`);
        return res.status(401).json({ message: `User ${id} not found in ${User.db.name}` });
      }

      console.log(`✅ Auth: Authenticated user ${req.user.email}`);
      return next();
    } catch (error) {
      console.error("❌ Auth Error:", error.message);
      return res.status(401).json({ message: "Not authorized", error: error.message });
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
