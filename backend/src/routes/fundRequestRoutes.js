const express = require('express');
const { createRequest, getMyRequests, getRequestById, updateRequest, cancelRequest, getOpenRequests } = require('../controllers/fundRequestController');
const { contribute } = require('../controllers/contributionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public or authenticated donor routes
router.get('/open', getOpenRequests); // Need to attach controller method
router.post('/:id/contributions', protect, authorize('USER', 'DONOR', 'RESEARCHER', 'ADMIN'), contribute);

router.use(protect); // All routes below are protected

router.post('/', authorize('RESEARCHER'), createRequest);
router.get('/my', authorize('RESEARCHER'), getMyRequests);
router.get('/:id', authorize('RESEARCHER', 'ADMIN'), getRequestById);
router.put('/:id', authorize('RESEARCHER'), updateRequest);
router.delete('/:id', authorize('RESEARCHER'), cancelRequest);

module.exports = router;
