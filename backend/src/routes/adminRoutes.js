// Admin routes: dashboard, users, researchers, experiments, fund requests. All require admin role.
const router = require("express").Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  reviewResearcherRules,
  deleteExperimentRules,
  userActionRules,
  researcherIdRules,
  validate,
} = require("../validators/adminValidators");
const {
  getPendingResearchers,
  getResearchers,
  getResearcherById,
  approveResearcher,
  rejectResearcher,
  deleteResearcher,
  getUsers,
  getUnapprovedResearchers,
  approveUser,
  rejectUser,
  deleteExperiment,
  exportResearchersPdf,
  getAnalytics,
  getAllRequests,
  updateStatus,
  getReports,
  disburseRequest,
} = require("../controllers/adminController");
const { getWallet } = require("../controllers/walletController");

const adminGuard = [protect, authorize("admin")];

// Analytics and reports
router.get("/analytics", adminGuard, getAnalytics);
router.get("/fund-analytics", adminGuard, getAnalytics);
router.get("/fund-reports", adminGuard, getReports);

// Users: list all, list unapproved, approve or reject by id
router.get("/users", adminGuard, getUsers);
router.get("/users/unapproved", adminGuard, getUnapprovedResearchers);
router.patch("/users/approve/:id", adminGuard, userActionRules(), validate, approveUser);
router.patch("/users/reject/:id", adminGuard, userActionRules(), validate, rejectUser);

// Researchers: list pending, list (optional status filter), get one, approve/reject, delete, export PDF
router.get("/researchers/pending", adminGuard, getPendingResearchers);
router.get("/researchers", adminGuard, getResearchers);
router.get("/researchers/export/pdf", adminGuard, exportResearchersPdf);
router.get("/researchers/:id", adminGuard, researcherIdRules(), validate, getResearcherById);
router.put("/researchers/:id/approve", adminGuard, reviewResearcherRules(), validate, approveResearcher);
router.put("/researchers/:id/reject", adminGuard, reviewResearcherRules(), validate, rejectResearcher);
router.delete("/researchers/:id", adminGuard, researcherIdRules(), validate, deleteResearcher);

// Experiments: admin can delete (optional reject researcher / reassign to participant)
router.delete("/experiments/:id", adminGuard, deleteExperimentRules(), validate, deleteExperiment);

// Fund requests: list all, update status; get experiment wallet
router.get("/fund-requests", adminGuard, getAllRequests);
router.patch("/fund-requests/:id/status", adminGuard, updateStatus);
router.get("/experiments/:experimentId/wallet", adminGuard, getWallet);

module.exports = router;
