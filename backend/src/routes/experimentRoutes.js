const router = require("express").Router();

// Note: checking which middleware folder to use (middlewares vs middleware)
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');

const {
  createExperiment,
  getExperiments,
  getExperimentById,
  updateExperiment,
  deleteExperiment,
} = require("../controllers/experimentController");

const { getReviewsByExperiment } = require("../controllers/reviewController");

const { getWallet } = require('../controllers/walletController');

router.get("/", getExperiments);
router.get("/:id", getExperimentById);

// Protected routes (Researcher / Admin)
router.use(protect);

router.post("/", authorize('researcher'), createExperiment);
router.get("/:experimentId/wallet", getWallet); // Service handles ownership check
router.put("/:id", authorize('researcher', 'admin'), updateExperiment);
router.delete("/:id", authorize('researcher', 'admin'), deleteExperiment);

// List reviews for an experiment
router.get("/:experimentId/reviews", optionalAuth, getReviewsByExperiment);

module.exports = router;
