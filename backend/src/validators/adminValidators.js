const { body, param, validationResult } = require("express-validator");

const reviewResearcherRules = () => [
  param("id").isMongoId().withMessage("Invalid researcher ID"),
  body("reviewNotes").optional().trim(),
];

const deleteExperimentRules = () => [
  param("id").isMongoId().withMessage("Invalid experiment ID"),
  body("rejectResearcher").optional().isBoolean().withMessage("rejectResearcher must be boolean"),
  body("reassignToParticipant").optional().isBoolean().withMessage("reassignToParticipant must be boolean"),
];

const userActionRules = () => [
  param("id").isMongoId().withMessage("Invalid user ID"),
];

const researcherIdRules = () => [
  param("id").isMongoId().withMessage("Invalid researcher ID"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const message = errors.array().map((e) => e.msg).join("; ");
  return res.status(400).json({ success: false, message });
};

module.exports = {
  reviewResearcherRules,
  deleteExperimentRules,
  userActionRules,
  researcherIdRules,
  validate,
};
