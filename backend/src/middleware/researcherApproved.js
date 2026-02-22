const Researcher = require("../models/Researcher");
const { HTTP_STATUS } = require("../config/constants");

/**
 * Use after optionalAuth. For POST (create experiment): researchers must have status "approved".
 */
const researcherApprovedForPublish = async (req, res, next) => {
  if (req.method !== "POST") return next();
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Authentication required" });
  }
  if (req.user.role !== "researcher") return next();
  const researcher = await Researcher.findOne({ user: req.user._id });
  if (!researcher) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Researcher profile not found",
    });
  }
  if (researcher.status !== "approved") {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "You must be approved by an admin before publishing experiments",
    });
  }
  next();
};

module.exports = researcherApprovedForPublish;
