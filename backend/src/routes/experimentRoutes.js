const express = require('express');
const { createExperiment } = require('../controllers/experimentController');
const { getWallet } = require('../controllers/walletController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('RESEARCHER', 'ADMIN'), createExperiment);

// Wallet access for researcher
router.get('/:experimentId/wallet', authorize('RESEARCHER', 'ADMIN'), getWallet);

module.exports = router;
