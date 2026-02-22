/**
 * Validators for admin review: approve/reject (reviewNotes) only. Admin does not edit researcher details.
 */
const { body, param, validationResult } = require("express-validator");

/** Rules for approve and reject: researcher id + optional reviewNotes */
const reviewResearcherRules = () => [
  param("id").isMongoId().withMessage("Invalid researcher ID"),
  body("reviewNotes").optional().trim(),
];

/** Rules for admin delete experiment: experiment id + optional rejectResearcher, reassignToParticipant (booleans) */
const deleteExperimentRules = () => [
  param("id").isMongoId().withMessage("Invalid experiment ID"),
  body("rejectResearcher").optional().isBoolean().withMessage("rejectResearcher must be boolean"),
  body("reassignToParticipant").optional().isBoolean().withMessage("reassignToParticipant must be boolean"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const messages = errors.array().map((e) => e.msg);
  return res.status(400).json({ success: false, message: messages.join("; ") });
};

module.exports = {
  reviewResearcherRules,
  deleteExperimentRules,
  validate,
};
