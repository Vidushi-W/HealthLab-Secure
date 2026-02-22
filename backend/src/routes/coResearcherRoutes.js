const express = require("express");
const router = express.Router({ mergeParams: true });

const { requireAuth, requireRole, optionalAuth } = require("../middlewares/auth");
const {
  addCoResearcher,
  listCoResearchers,
  updateCoResearcher,
  removeCoResearcher,
} = require("../controllers/coResearcherController");

// GET /experiments/:experimentId/co-researchers
router.get("/", optionalAuth, listCoResearchers);

// POST /experiments/:experimentId/co-researchers
router.post("/", requireAuth, requireRole(["researcher", "admin"]), addCoResearcher);

// PUT /experiments/:experimentId/co-researchers/:coResearcherId
router.put(
  "/:coResearcherId",
  requireAuth,
  requireRole(["researcher", "admin"]),
  updateCoResearcher
);

// DELETE /experiments/:experimentId/co-researchers/:coResearcherId
router.delete(
  "/:coResearcherId",
  requireAuth,
  requireRole(["researcher", "admin"]),
  removeCoResearcher
);

module.exports = router;