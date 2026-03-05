const express = require('express');
const { createPayment, paymentWebhook, getPaymentStatus } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create', protect, authorize('participant', 'researcher', 'admin'), createPayment);
router.get('/status/:orderId', protect, getPaymentStatus);
router.post('/webhook', paymentWebhook);

module.exports = router;
