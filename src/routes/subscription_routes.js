const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription_controller');
const subscriptionValidators = require('../utils/validation_subscription');
const validateRequest = require('../middlewares/validator_middleware');
const authMiddleware = require('../middlewares/auth.middleware');

// Create a test route
router.get('/test-jwt', authMiddleware.verifyToken, (req, res) => {
  res.json({
    success: true,
    userObject: req.user,
    userId: req.user?.userId,
    profileKey: req.user?.profileKey
  });
});

// Create subscription (requires authentication)
router.post(
  '/create',
  authMiddleware.verifyToken,
  subscriptionValidators.createSubscription,
  validateRequest,
  subscriptionController.createSubscription
);

// Get user subscription status (requires authentication)
router.get(
  '/user/:userId?',
  authMiddleware.verifyToken,
  subscriptionValidators.getUserSubscription,
  validateRequest,
  subscriptionController.getUserSubscription
);

// Get all subscriptions (admin - requires authentication)
router.get(
  '/all',
  authMiddleware.verifyToken,
  subscriptionValidators.getAllSubscriptions,
  validateRequest,
  subscriptionController.getAllSubscriptions
);

// Cancel subscription (requires authentication)
router.put(
  '/cancel/:id', 
  authMiddleware.verifyToken,
  subscriptionValidators.cancelSubscription,
  validateRequest,
  subscriptionController.cancelSubscription
);

// Update subscription status (admin - requires authentication)
router.put(
  '/status/:id',
  authMiddleware.verifyToken,
  subscriptionValidators.updateSubscriptionStatus,
  validateRequest,
  subscriptionController.updateSubscriptionStatus
);

// Verify subscription status (requires authentication)
router.get(
  '/verify/:id',
  authMiddleware.verifyToken,
  subscriptionValidators.verifySubscriptionStatus,
  validateRequest,
  subscriptionController.verifySubscriptionStatus
);

// Get user subscription history (requires authentication)
router.get(
  '/history/:userId?',
  authMiddleware.verifyToken,
  subscriptionValidators.getUserSubscriptionHistory,
  validateRequest,
  subscriptionController.getUserSubscriptionHistory
);

// Check user subscription status (requires authentication)
router.get(
  '/check/:userId?',
  authMiddleware.verifyToken,
  subscriptionValidators.checkUserSubscription,
  validateRequest,
  subscriptionController.checkUserSubscription
);

// Get subscription by ID (returns any subscription regardless of status)
router.get(
  '/by-id/:id',
  authMiddleware.verifyToken,
  subscriptionController.getSubscriptionByIdOnly
);

// Get raw subscription data (simple endpoint)
router.get(
  '/raw/:id',
  authMiddleware.verifyToken,
  subscriptionController.getRawSubscription
);

// Get complete subscription details
router.get(
  '/complete/:id',
  authMiddleware.verifyToken,
  subscriptionController.getCompleteSubscriptionDetails
);

// Get expiring subscriptions (admin - requires authentication)
router.get(
  '/expiring',
  authMiddleware.verifyToken,
  subscriptionValidators.getExpiringSubscriptions,
  validateRequest,
  subscriptionController.getExpiringSubscriptions
);

// Get subscription by ID (requires authentication)
router.get(
  '/:id',
  authMiddleware.verifyToken,
  subscriptionValidators.getSubscriptionById,
  validateRequest,
  subscriptionController.getSubscriptionById
);

module.exports = router;