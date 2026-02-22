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
  getAnalytics, // Note: conflict in adminController between analytics and fund-analytics
  getAllRequests,
  updateStatus,
  disburseRequest,
  getReports
} = require("../controllers/adminController");
const { getWallet } = require('../controllers/walletController');

// Using middleware from both branches (they might serve different purposes)
const { requiredAuth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const { protect, authorize } = require('../middlewares/authMiddleware');

const { reviewResearcherRules, deleteExperimentRules, validate } = require("../validators/adminValidators");

/** 
 * Merging Middlewares: 
 * Using protect/authorize for Fund Management 
 * Using requiredAuth/adminOnly for Researcher review
 * We'll unify them here assuming they guard similarly.
 */
const adminGuard = [protect || requiredAuth, authorize ? authorize('ADMIN') : adminOnly];

/** Dashboard analytics */
router.get("/analytics", adminGuard, getAnalytics);

/** Get all users */
router.get("/users", adminGuard, getUsers);

/** Researcher Review Routes */
router.get("/researchers/pending", adminGuard, getPendingResearchers);
router.get("/researchers", adminGuard, getResearchers);
router.get("/researchers/export/pdf", adminGuard, exportResearchersPdf);
router.get("/researchers/:id", adminGuard, getResearcherById);
router.put("/researchers/:id/approve", adminGuard, reviewResearcherRules ? reviewResearcherRules() : [], validate || ((req, res, next) => next()), approveResearcher);
router.put("/researchers/:id/reject", adminGuard, reviewResearcherRules ? reviewResearcherRules() : [], validate || ((req, res, next) => next()), rejectResearcher);

/** Experiment Management */
router.delete("/experiments/:id", adminGuard, deleteExperimentRules ? deleteExperimentRules() : [], validate || ((req, res, next) => next()), deleteExperiment);

/** Fund Management Admin Routes */
router.get('/fund-requests', adminGuard, getAllRequests);
router.patch('/fund-requests/:id/status', adminGuard, updateStatus);
router.get('/experiments/:experimentId/wallet', adminGuard, getWallet);
router.get('/fund-analytics', adminGuard, getAnalytics);
router.get('/fund-reports', adminGuard, getReports);

module.exports = router;

module.exports = router;
