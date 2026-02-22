const router = require("express").Router();
const { extractUserFromHeader } = require("../middleware/rbacMiddleware");
const { requireAuth, roleMiddleware } = require("../middleware/authMiddleware");

const {
  joinExperiment,
  getMyStudies,
  leaveExperiment,
  getParticipantsList,
} = require("../controllers/participationController");

// Extract user info from header (for development/testing)
router.use(extractUserFromHeader);

// POST /participations/join - Join an experiment (authenticated users)
router.post("/join", requireAuth, joinExperiment);

// GET /participations/my-studies - Get user's studies (authenticated users)
router.get("/my-studies", requireAuth, getMyStudies);

// PUT /participations/:id/leave - Leave a study (authenticated users)
router.put("/:id/leave", requireAuth, leaveExperiment);

// GET /participations/experiment/:experimentId/participants - Get participant list (Researchers only)
// This requires researcher or admin role
router.get(
  "/experiment/:experimentId/participants",
  requireAuth,
  roleMiddleware(["researcher", "admin"]),
  getParticipantsList
);

module.exports = router;
