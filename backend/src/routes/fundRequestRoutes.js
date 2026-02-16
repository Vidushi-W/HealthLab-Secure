const express = require('express');
const { createRequest, getMyRequests, getRequestById, updateRequest, cancelRequest } = require('../controllers/fundRequestController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect); // All routes protected

router.post('/', authorize('RESEARCHER'), createRequest);
router.get('/my', authorize('RESEARCHER'), getMyRequests);
router.get('/:id', authorize('RESEARCHER', 'ADMIN'), getRequestById);
router.put('/:id', authorize('RESEARCHER'), updateRequest);
router.delete('/:id', authorize('RESEARCHER'), cancelRequest);

module.exports = router;
