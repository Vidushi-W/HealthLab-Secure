const express = require('express');
const { getAllRequests, updateStatus, disburseRequest, getAnalytics, getReports } = require('../controllers/adminController');
const { getWallet } = require('../controllers/walletController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/fund-requests', getAllRequests);
router.patch('/fund-requests/:id/status', updateStatus);

router.get('/experiments/:experimentId/wallet', getWallet);

router.get('/fund-analytics', getAnalytics);
router.get('/fund-reports', getReports);

module.exports = router;
