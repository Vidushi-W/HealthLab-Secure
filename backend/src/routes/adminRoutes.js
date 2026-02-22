/**
 * Admin routes: users, researchers, experiments (delete), exports.
 * All routes require JWT auth and admin role (adminOnly middleware).
 */
const router = require("express").Router();
const {
  getPendingResearchers,
  getResearchers,
  getResearcherById,
  approveResearcher,
  rejectResearcher,
  getUsers,
  deleteExperiment,
  exportResearchersPdf,
  getAnalytics,
} = require("../controllers/adminController");
const { requiredAuth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const { reviewResearcherRules, deleteExperimentRules, validate } = require("../validators/adminValidators");

/** Require authenticated admin for all routes below */
router.use(requiredAuth, adminOnly);

/** Dashboard analytics: total researchers, by status, by type, pending backlog, overdue count */
router.get("/analytics", getAnalytics);

/** Get all users (participants, researchers, etc.); optional ?role= filter */
router.get("/users", getUsers);

/** Get researchers awaiting review (status: pending) */
router.get("/researchers/pending", getPendingResearchers);
/** Get all researchers for table; optional ?status=pending|approved|rejected */
router.get("/researchers", getResearchers);
/** Download researcher report as PDF; optional ?status= filter (must be before :id) */
router.get("/researchers/export/pdf", exportResearchersPdf);
/** Get one researcher by ID (full details for review) */
router.get("/researchers/:id", getResearcherById);
/** Approve researcher (body: optional reviewNotes) */
router.put("/researchers/:id/approve", reviewResearcherRules(), validate, approveResearcher);
/** Reject researcher (body: optional reviewNotes) */
router.put("/researchers/:id/reject", reviewResearcherRules(), validate, rejectResearcher);

/** Delete experiment (e.g. policy violation). Body: optional rejectResearcher, reassignToParticipant (boolean) */
router.delete("/experiments/:id", deleteExperimentRules(), validate, deleteExperiment);

module.exports = router;
