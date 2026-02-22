const { HTTP_STATUS } = require("../config/constants");

/** Restricts access to admin role; used for admin review routes. Requires req.user (set by auth). */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: "Admin access required" });
  }
  next();
};

module.exports = adminOnly;
