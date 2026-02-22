const express = require('express');
const { getMyContributions, getAllContributions, updateStatus, voidContribution } = require('../controllers/contributionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

// User/Donor routes
router.get('/my', authorize('USER', 'DONOR', 'RESEARCHER', 'ADMIN'), getMyContributions);

// Admin / System routes
router.get('/admin', authorize('ADMIN'), getAllContributions);
router.patch('/:id/status', authorize('ADMIN'), updateStatus);
router.delete('/:id', authorize('ADMIN'), voidContribution);

module.exports = router;
