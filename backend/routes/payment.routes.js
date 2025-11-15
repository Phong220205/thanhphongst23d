const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

// Create payment intent (requires authentication)
router.post('/create-intent', protect, paymentController.createPaymentIntent);

// Confirm payment (requires authentication)
router.post('/confirm', protect, paymentController.confirmPayment);

// Webhook endpoint (no auth, Stripe verifies via signature)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

module.exports = router;

