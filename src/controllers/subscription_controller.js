const subscriptionService = require('../services/subscription_service');

class SubscriptionController {
  // Create subscription (without payment processing)
  async createSubscription(req, res) {
    try {
      const subscriptionData = {
        ...req.body,
        user: req.body.user || req.user?.userId
      };

      const subscription = await subscriptionService.createSubscription(subscriptionData);
      
      res.status(201).json({
        success: true,
        message: 'Subscription created successfully and user updated',
        data: subscription
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get subscription by ID
  async getSubscriptionById(req, res) {
    try {
      const { id } = req.params;
      
      const subscription = await subscriptionService.getSubscriptionById(id);
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: subscription
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user subscription status
  async getUserSubscription(req, res) {
    try {
      const userId = req.params.userId || req.user?.userId;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required. Please provide a valid user ID in the URL path or ensure you are authenticated.'
        });
      }

      const subscriptionInfo = await subscriptionService.getUserSubscription(userId);
      
      res.status(200).json({
        success: true,
        message: subscriptionInfo.isFreeMode ? 
          'User is in free mode' : 
          `Subscription found (status: ${subscriptionInfo.subscriptionStatus})`,
        data: subscriptionInfo
      });
    } catch (error) {
      const statusCode = error.message.includes('valid') || error.message.includes('not found') ? 
        400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message,
        suggestion: error.message.includes('User ID') ? 
          'Please ensure you are using the correct endpoint format: GET /api/subscriptions/user/:userId' : 
          'Please check the user ID and try again'
      });
    }
  }

  // Get all subscriptions (admin)
  async getAllSubscriptions(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const filter = status ? { status } : {};
      
      const result = await subscriptionService.getAllSubscriptions(
        parseInt(page),
        parseInt(limit),
        filter
      );
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Cancel subscription
  async cancelSubscription(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId; // Get user ID from authenticated user
      
      const subscription = await subscriptionService.cancelSubscription(id, userId);
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: {
          subscription: {
            id: subscription._id,
            status: subscription.status,
            user: subscription.user,
            updatedAt: subscription.updatedAt
          },
          userStatus: 'free' // Confirm user status is updated
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Verify subscription status
  async verifySubscriptionStatus(req, res) {
    try {
      const { id } = req.params;
      
      const verification = await subscriptionService.verifySubscriptionStatus(id);
      
      res.status(200).json({
        success: true,
        data: verification
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user subscription history
  async getUserSubscriptionHistory(req, res) {
    try {
      const userId = req.params.userId || req.user?.userId;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required. Please provide a valid user ID in the URL path or ensure you are authenticated.'
        });
      }

      const history = await subscriptionService.getUserSubscriptionHistory(userId);
      
      res.status(200).json({
        success: true,
        message: history.hasSubscriptions ? 
          `Found ${history.total} subscription(s) for user` : 
          'No subscription history found for this user',
        data: history
      });
    } catch (error) {
      const statusCode = error.message.includes('valid') || error.message.includes('not found') ? 
        400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message,
        suggestion: 'Please use the correct user ID format (24-character MongoDB ObjectId)'
      });
    }
  }

  // Get subscription by ID only - Returns any subscription (active, cancelled, expired, pending)
  async getSubscriptionByIdOnly(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Subscription ID is required'
        });
      }

      const subscription = await subscriptionService.getSubscriptionByIdOnly(id);
      
      res.status(200).json({
        success: true,
        message: `Subscription found (Status: ${subscription.statusInfo.currentStatus})`,
        data: subscription
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get raw subscription data
  async getRawSubscription(req, res) {
    try {
      const { id } = req.params;
      
      const subscription = await subscriptionService.getRawSubscriptionById(id);
      
      res.status(200).json(subscription); // Direct JSON response
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Get complete subscription details
  async getCompleteSubscriptionDetails(req, res) {
    try {
      const { id } = req.params;
      
      const subscriptionDetails = await subscriptionService.getCompleteSubscriptionDetails(id);
      
      res.status(200).json({
        success: true,
        data: subscriptionDetails
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Check user subscription status
  async checkUserSubscription(req, res) {
    try {
      const userId = req.params.userId || req.user?.userId;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required. Please provide a valid user ID in the URL path or ensure you are authenticated.'
        });
      }

      const subscriptionCheck = await subscriptionService.checkUserSubscription(userId);
      
      res.status(200).json({
        success: true,
        message: `Subscription status checked for user ${userId}`,
        data: subscriptionCheck
      });
    } catch (error) {
      const statusCode = error.message.includes('valid') || error.message.includes('not found') ? 
        400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message,
        suggestion: 'Please provide a valid 24-character MongoDB ObjectId'
      });
    }
  }

  // Update subscription status
  async updateSubscriptionStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !['active', 'expired', 'cancelled', 'pending'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required'
        });
      }

      const subscription = await subscriptionService.updateSubscriptionStatus(id, status);
      
      res.status(200).json({
        success: true,
        message: `Subscription status updated to ${status} and user updated`,
        data: subscription
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get expiring subscriptions
  async getExpiringSubscriptions(req, res) {
    try {
      const { days = 7 } = req.query;
      
      const expiringSubscriptions = await subscriptionService.getExpiringSubscriptions(parseInt(days));
      
      res.status(200).json({
        success: true,
        data: {
          count: expiringSubscriptions.length,
          subscriptions: expiringSubscriptions
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new SubscriptionController();