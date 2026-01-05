const { body, param, query } = require('express-validator');

const subscriptionValidators = {
  // Create subscription validation
  createSubscription: [
    body('user').optional().isMongoId().withMessage('Valid user ID is required'),
    body('package').isMongoId().withMessage('Valid package ID is required'),
    body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    body('paymentMethod').optional().isString().withMessage('Valid payment method is required'),
    body('transactionId').optional().isString().withMessage('Valid transaction ID is required')
  ],

  // Get subscription by ID validation
  getSubscriptionById: [
    param('id').isMongoId().withMessage('Valid subscription ID is required')
  ],

  // Get user subscription validation
  getUserSubscription: [
    param('userId').optional().isMongoId().withMessage('Valid user ID is required')
  ],

  // Get all subscriptions validation
  getAllSubscriptions: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'expired', 'cancelled', 'pending']).withMessage('Valid status is required')
  ],

  // Cancel subscription validation
  cancelSubscription: [
    param('id').isMongoId().withMessage('Valid subscription ID is required')
  ],

  // Verify subscription status validation
  verifySubscriptionStatus: [
    param('id').isMongoId().withMessage('Valid subscription ID is required')
  ],

  // Get user subscription history validation
  getUserSubscriptionHistory: [
    param('userId').optional().isMongoId().withMessage('Valid user ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],

  // Check user subscription validation
  checkUserSubscription: [
    param('userId').optional().isMongoId().withMessage('Valid user ID is required')
  ],

  // Update subscription status validation
  updateSubscriptionStatus: [
    param('id').isMongoId().withMessage('Valid subscription ID is required'),
    body('status')
      .isIn(['active', 'expired', 'cancelled', 'pending'])
      .withMessage('Valid status is required')
  ],

  // Get expiring subscriptions validation
  getExpiringSubscriptions: [
    query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30')
  ]
};

module.exports = subscriptionValidators;