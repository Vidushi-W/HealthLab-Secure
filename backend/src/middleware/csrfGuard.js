// Custom headers require a CORS preflight checked against our explicit origin list.
// Requiring this even without Origin blocks simple forms and login CSRF.
module.exports = (req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.get("X-Requested-With") !== "HealthLab") {
    return res.status(403).json({ success: false, message: "CSRF check failed" });
  }
  next();
};
