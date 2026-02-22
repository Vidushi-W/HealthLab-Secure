const router = require("express").Router();
const authController = require("../controllers/authController");
const { registerResearcher, login } = require("../controllers/authController");

const {
  registerResearcherRules,
  loginRules,
  validate,
  validateRegisterConditionals,
} = require("../validators/authValidators");

const { uploadAffiliationProof } = require("../middleware/upload");

/**
 * Participant registration (simple)
 * from feature/participation-enrollment
 */
router.post("/register-participant", authController.register);

/**
 * Researcher registration (with upload + validation)
 * from Develop_Integration
 */
router.post(
  "/register",
  uploadAffiliationProof,
  registerResearcherRules(),
  validate,
  validateRegisterConditionals,
  registerResearcher
);

/**
 * Login (validated)
 */
router.post("/login", loginRules(), validate, login);

module.exports = router;