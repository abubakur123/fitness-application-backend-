const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment_controller');
const paymentValidators = require('../validation/payment_validation');
const validateRequest = require('../middlewares/validator_middleware');
const authMiddleware = require('../middlewares/auth.middleware');

// Process new payment (requires authentication)
router.post(
  '/process',
  authMiddleware.verifyToken,
  paymentValidators.processPayment,
  validateRequest,
  paymentController.processPayment
);

// Process subscription renewal payment (requires authentication)
router.post(
  '/renew/:id',
  authMiddleware.verifyToken,
  paymentValidators.processRenewalPayment,
  validateRequest,
  paymentController.processRenewalPayment
);

// Handle payment webhook (no authentication required for webhooks)
router.post(
  '/webhook',
  paymentValidators.handlePaymentWebhook,
  validateRequest,
  paymentController.handlePaymentWebhook
);

// Refund payment (admin - requires authentication)
router.post(
  '/refund/:transactionId',
  authMiddleware.verifyToken,
  paymentValidators.refundPayment,
  validateRequest,
  paymentController.refundPayment
);

// Get payment details (requires authentication)
router.get(
  '/details/:transactionId',
  authMiddleware.verifyToken,
  paymentValidators.getPaymentDetails,
  validateRequest,
  paymentController.getPaymentDetails
);

// Get user payment history (requires authentication)
router.get(
  '/history/:userId?',
  authMiddleware.verifyToken,
  paymentValidators.getUserPaymentHistory,
  validateRequest,
  paymentController.getUserPaymentHistory
);

// Test payment webhook endpoint
router.get(
  '/test-webhook',
  authMiddleware.verifyToken,
  (req, res) => {
    res.json({
      success: true,
      message: 'Payment webhook endpoint is accessible',
      timestamp: new Date().toISOString()
    });
  }
);

module.exports = router;