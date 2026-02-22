const router = require("express").Router();
const { requireAuth, requireRole, optionalAuth } = require("../middlewares/auth");
const {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

// List reviews (anyone can read; optional auth for draft visibility)
router.get("/", optionalAuth, getReviews);

// Get one review (anyone can read published; author/admin for drafts)
router.get("/:id", optionalAuth, getReviewById);

// Create: authenticated researcher or admin only
router.post("/", requireAuth, requireRole(["researcher", "admin"]), createReview);

// Update / Delete: require auth; author or admin check is done in service
router.put("/:id", requireAuth, requireRole(["researcher", "admin"]), updateReview);
router.delete("/:id", requireAuth, requireRole(["researcher", "admin"]), deleteReview);

module.exports = router;
