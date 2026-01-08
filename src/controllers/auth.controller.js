const authService = require('../services/auth_services');
const jwt = require('jsonwebtoken');

class AuthController {
  // Get user by ID (from URL parameter)
  async getUserByUserId(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const user = await authService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          profileKey: user.profileKey,
          fitnessPlanId: user.fitnessPlanId,
          remarks: user.remarks,
          isVerified: user.isVerified,
          subscriptionStatus: user.subscriptionStatus || 'free',
          currentSubscription: user.currentSubscription || null,
          currentSubscriptionDetails: user.currentSubscriptionDetails || null,
          isPaidUser: user.isPaidUser || user.subscriptionStatus === 'active',
          subscriptionInfo: user.getSubscriptionInfo ? user.getSubscriptionInfo() : {
            isPaidUser: user.subscriptionStatus === 'active',
            subscriptionStatus: user.subscriptionStatus,
            hasActiveSubscription: user.subscriptionStatus === 'active'
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });

    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Initiate signup - RETURN CODE IN RESPONSE
  async initiateSignup(req, res) {
    try {
      const { email, profileKey, fitnessPlanId } = req.body;

      if (!email || !profileKey) {
        return res.status(400).json({
          success: false,
          message: 'Email and profile key are required'
        });
      }

      const result = await authService.initiateSignup(email, profileKey, fitnessPlanId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      // Return the code in response for development
      res.status(200).json({
        success: result.success,
        message: result.message,
        code: result.code
      });

    } catch (error) {
      console.error('Signup initiation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Initiate login - RETURN CODE IN RESPONSE
  async initiateLogin(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const result = await authService.initiateLogin(email);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      // Return the code in response for development
      res.status(200).json({
        success: true,
        message: result.message,
        profileKey: result.profileKey,
        code: result.code
      });

    } catch (error) {
      console.error('Login initiation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Complete signup
  async completeSignup(req, res) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message: 'Email and verification code are required'
        });
      }

      const result = await authService.completeSignup(email, code);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        message: 'Signup successful',
        user: result.user,
        token: result.token
      });

    } catch (error) {
      console.error('Signup completion error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Complete login
  async completeLogin(req, res) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message: 'Email and verification code are required'
        });
      }

      const result = await authService.completeLogin(email, code);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: result.user,
        token: result.token
      });

    } catch (error) {
      console.error('Login completion error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Link profile to user
  async linkProfile(req, res) {
    try {
      const { email, profileKey } = req.body;

      if (!email || !profileKey) {
        return res.status(400).json({
          success: false,
          message: 'Email and profile key are required'
        });
      }

      const result = await authService.linkProfileToUser(email, profileKey);
      
      res.status(200).json({
        success: true,
        message: 'Profile linked successfully',
        user: result.user
      });

    } catch (error) {
      console.error('Profile linking error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get user by email
  async getUserByEmail(req, res) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const user = await authService.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          profileKey: user.profileKey,
          fitnessPlanId: user.fitnessPlanId,
          remarks: user.remarks,
          isVerified: user.isVerified,
          subscriptionStatus: user.subscriptionStatus || 'free',
          currentSubscription: user.currentSubscription || null,
          isPaidUser: user.isPaidUser || user.subscriptionStatus === 'active',
          subscriptionInfo: user.getSubscriptionInfo ? user.getSubscriptionInfo() : {
            isPaidUser: user.subscriptionStatus === 'active',
            subscriptionStatus: user.subscriptionStatus,
            hasActiveSubscription: user.subscriptionStatus === 'active'
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Search users
  async searchUsers(req, res) {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      if (!search) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
      }

      const result = await authService.searchUsers(search, parseInt(page), parseInt(limit));
      
      res.status(200).json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Delete user
  async deleteUser(req, res) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const result = await authService.deleteUser(email);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get user by ID (from token)
  async getUserById(req, res) {
    try {
      const userId = req.user.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID not found in token'
        });
      }

      const user = await authService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          profileKey: user.profileKey,
          fitnessPlanId: user.fitnessPlanId,
          remarks: user.remarks,
          isVerified: user.isVerified,
          subscriptionStatus: user.subscriptionStatus || 'free',
          currentSubscription: user.currentSubscription || null,
          currentSubscriptionDetails: user.currentSubscriptionDetails || null,
          isPaidUser: user.isPaidUser || user.subscriptionStatus === 'active',
          subscriptionInfo: user.getSubscriptionInfo ? user.getSubscriptionInfo() : {
            isPaidUser: user.subscriptionStatus === 'active',
            subscriptionStatus: user.subscriptionStatus,
            hasActiveSubscription: user.subscriptionStatus === 'active'
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });

    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
  
  // Get authenticated user by profile key
  async getAuthUserByProfileKey(req, res) {
    try {
      const { profileKey } = req.params;

      if (!profileKey) {
        return res.status(400).json({
          success: false,
          message: 'Profile key is required'
        });
      }

      const result = await authService.getAuthUserByProfileKey(profileKey);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json({
        success: true,
        user: result.user
      });

    } catch (error) {
      console.error('Get user by profile key error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Add fitness plan to user
  async addFitnessPlan(req, res) {
    try {
      const userId = req.user.userId;
      const { fitnessPlanId } = req.body;

      if (!fitnessPlanId) {
        return res.status(400).json({
          success: false,
          message: 'Fitness plan ID is required'
        });
      }

      const result = await authService.addFitnessPlanToUser(userId, fitnessPlanId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Fitness plan added successfully',
        user: result.user
      });

    } catch (error) {
      console.error('Add fitness plan error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Update fitness plan for user
  async updateFitnessPlan(req, res) {
    try {
      const userId = req.user.userId;
      const { fitnessPlanId } = req.body;

      if (!fitnessPlanId) {
        return res.status(400).json({
          success: false,
          message: 'Fitness plan ID is required'
        });
      }

      const result = await authService.updateFitnessPlanForUser(userId, fitnessPlanId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Fitness plan updated successfully',
        user: result.user
      });

    } catch (error) {
      console.error('Update fitness plan error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Check user subscription status
  async checkSubscriptionStatus(req, res) {
    try {
      const userId = req.user?.userId || req.params.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const user = await authService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        subscriptionStatus: user.subscriptionStatus || 'free',
        isPaidUser: user.isPaidUser || user.subscriptionStatus === 'active',
        currentSubscription: user.currentSubscription || null,
        currentSubscriptionDetails: user.currentSubscriptionDetails || null,
        hasActiveSubscription: (user.subscriptionStatus === 'active')
      });

    } catch (error) {
      console.error('Check subscription status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Update user subscription status (admin)
  async updateUserSubscriptionStatus(req, res) {
    try {
      const { userId } = req.params;
      const { subscriptionStatus } = req.body;

      if (!userId || !subscriptionStatus) {
        return res.status(400).json({
          success: false,
          message: 'User ID and subscription status are required'
        });
      }

      if (!['free', 'active', 'expired', 'cancelled', 'pending'].includes(subscriptionStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subscription status'
        });
      }

      const result = await authService.updateUserSubscription(userId, {
        status: subscriptionStatus
      });

      res.status(200).json({
        success: true,
        message: 'User subscription status updated successfully',
        data: result.user
      });

    } catch (error) {
      console.error('Update user subscription status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Verify token middleware
  verifyToken(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  }

  // Migrate user subscriptions (remove subscriptionHistory references)
  async migrateUserSubscriptions(req, res) {
    try {
      // Add admin check (optional)
      const isAdmin = req.user?.isAdmin || req.headers['x-admin-key'] === process.env.ADMIN_KEY;
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }
      
      const User = require('../models/auth.model');
      
      // Find all users without subscriptionStatus
      const usersToUpdate = await User.find({
        $or: [
          { subscriptionStatus: { $exists: false } },
          { subscriptionStatus: null }
        ]
      });
      
      console.log(`Found ${usersToUpdate.length} users to update`);
      
      // Update each user
      let updatedCount = 0;
      for (const user of usersToUpdate) {
        try {
          user.subscriptionStatus = 'free';
          user.currentSubscription = null;
          await user.save();
          updatedCount++;
        } catch (err) {
          console.error(`Error updating user ${user._id}:`, err.message);
        }
      }
      
      // Bulk update for any remaining users
      const bulkResult = await User.updateMany(
        {},
        { 
          $setOnInsert: { 
            subscriptionStatus: 'free'
          }
        },
        { upsert: false }
      );
      
      res.status(200).json({
        success: true,
        message: 'Migration completed successfully',
        data: {
          individuallyUpdated: updatedCount,
          bulkModified: bulkResult.modifiedCount,
          totalUsers: await User.countDocuments(),
          freeUsers: await User.countDocuments({ subscriptionStatus: 'free' })
        }
      });
      
    } catch (error) {
      console.error('Migration error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Migration failed'
      });
    }
  }
}

module.exports = new AuthController();