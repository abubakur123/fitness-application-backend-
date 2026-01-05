const { body, param, query } = require('express-validator');

const paymentValidators = {
  // Process payment validation
  processPayment: [
    body('userId').optional().isMongoId().withMessage('Valid user ID is required'),
    body('packageId').isMongoId().withMessage('Valid package ID is required'),
    body('paymentMethod')
      .isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'razorpay', 'other'])
      .withMessage('Valid payment method is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Valid currency code is required'),
    body('transactionId').optional().isString().withMessage('Valid transaction ID is required'),
    body('paymentGateway').optional().isString().withMessage('Valid payment gateway is required')
  ],

  // Process renewal payment validation
  processRenewalPayment: [
    param('id').isMongoId().withMessage('Valid subscription ID is required'),
    body('paymentMethod')
      .isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'razorpay', 'other'])
      .withMessage('Valid payment method is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('transactionId').optional().isString().withMessage('Valid transaction ID is required')
  ],

  // Handle payment webhook validation
  handlePaymentWebhook: [
    body('transactionId').isString().withMessage('Transaction ID is required'),
    body('status')
      .isIn(['success', 'failed', 'pending', 'refunded', 'cancelled'])
      .withMessage('Valid payment status is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('userId').optional().isMongoId().withMessage('Valid user ID is required'),
    body('packageId').optional().isMongoId().withMessage('Valid package ID is required'),
    body('paymentMethod').optional().isString().withMessage('Valid payment method is required'),
    body('paymentGateway').optional().isString().withMessage('Valid payment gateway is required'),
    body('gatewayTransactionId').optional().isString().withMessage('Valid gateway transaction ID is required')
  ],

  // Refund payment validation
  refundPayment: [
    param('transactionId').isString().withMessage('Valid transaction ID is required'),
    body('refundAmount').optional().isFloat({ min: 0 }).withMessage('Valid refund amount is required'),
    body('reason').optional().isString().withMessage('Valid refund reason is required')
  ],

  // Get payment details validation
  getPaymentDetails: [
    param('transactionId').isString().withMessage('Valid transaction ID is required')
  ],

  // Get user payment history validation
  getUserPaymentHistory: [
    param('userId').optional().isMongoId().withMessage('Valid user ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ]
};

module.exports = paymentValidators;