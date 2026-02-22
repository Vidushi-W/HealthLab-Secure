const router = require("express").Router();
const { optionalAuth } = require("../middlewares/auth");
const {
  createExperiment,
  getExperiments,
  getExperimentById,
  updateExperiment,
  deleteExperiment,
} = require("../controllers/experimentController");
const { getReviewsByExperiment } = require("../controllers/reviewController");

router.post("/", createExperiment);
router.get("/", getExperiments);

// List reviews for an experiment (must be before /:id)
router.get("/:experimentId/reviews", optionalAuth, getReviewsByExperiment);

// GET /experiments/:id
router.get("/:id", getExperimentById);

router.put("/:id", updateExperiment);
router.delete("/:id", deleteExperiment);

module.exports = router;

