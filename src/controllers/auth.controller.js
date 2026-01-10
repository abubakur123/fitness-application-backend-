const authService = require('../services/auth_services');
const jwt = require('jsonwebtoken');

class AuthController {
  // ========== NEW: GOOGLE OAUTH ENDPOINT ==========
  
  // Google login/signup
  async googleAuth(req, res) {
    try {
      const { google_id, email, display_name, firebase_uid, email_verified, profileKey, fitnessPlanId } = req.body;

      // Support both snake_case (from Google) and camelCase
      const googleId = google_id || req.body.googleId;
      const name = display_name || req.body.name;

      if (!googleId || !email) {
        return res.status(400).json({
          success: false,
          message: 'Google ID and email are required'
        });
      }

      const result = await authService.googleAuth({
        google_id: googleId,
        email,
        display_name: name,
        firebase_uid,
        email_verified,
        profileKey,
        fitnessPlanId
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: result.isNewUser ? 'Account created successfully' : 'Login successful',
        isNewUser: result.isNewUser,
        linkedExisting: result.linkedExisting || false,
        user: result.user,
        token: result.token
      });

    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // ========== EXISTING METHODS (UNCHANGED) ==========

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
          authProvider: user.authProvider || 'email',
          googleProfile: user.googleProfile || null,
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
          authProvider: user.authProvider || 'email',
          googleProfile: user.googleProfile || null,
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
          authProvider: user.authProvider || 'email',
          googleProfile: user.googleProfile || null,
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

  async migrateUserSubscriptions(req, res) {
    try {
      const isAdmin = req.user?.isAdmin || req.headers['x-admin-key'] === process.env.ADMIN_KEY;
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }
      
      const User = require('../models/auth.model');
      
      const usersToUpdate = await User.find({
        $or: [
          { subscriptionStatus: { $exists: false } },
          { subscriptionStatus: null }
        ]
      });
      
      console.log(`Found ${usersToUpdate.length} users to update`);
      
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