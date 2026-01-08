const User = require('../models/auth.model');
const jwt = require('jsonwebtoken');
const Subscription = require('../models/subscription_model');

// In-memory stores (use Redis in production)
const verificationCodes = new Map();
const signupData = new Map(); // Store email -> profileKey and fitnessPlanId temporarily
const CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes

class AuthService {
  // Generate random 4-digit code
  generateVerificationCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Store verification code with email, profileKey, and fitnessPlanId
  storeVerificationData(email, code, profileKey = null, fitnessPlanId = null) {
    const expiry = Date.now() + CODE_EXPIRY;
    
    // Store verification code
    verificationCodes.set(email, { code, expiry });
    
    // Store profileKey and fitnessPlanId for signup if provided
    if (profileKey) {
      signupData.set(email, { profileKey, fitnessPlanId, expiry });
    }
    
    // Auto-cleanup after expiry
    setTimeout(() => {
      if (verificationCodes.get(email)?.expiry <= Date.now()) {
        verificationCodes.delete(email);
      }
      if (signupData.get(email)?.expiry <= Date.now()) {
        signupData.delete(email);
      }
    }, CODE_EXPIRY);
  }

  // Verify code
  verifyCode(email, code) {
    const stored = verificationCodes.get(email);
    
    if (!stored) {
      return { isValid: false, message: 'No verification code found' };
    }
    
    if (Date.now() > stored.expiry) {
      verificationCodes.delete(email);
      return { isValid: false, message: 'Verification code expired' };
    }
    
    if (stored.code !== code) {
      return { isValid: false, message: 'Invalid verification code' };
    }
    
    // Code is valid, remove it
    verificationCodes.delete(email);
    return { isValid: true };
  }

  // Generate JWT token
  generateToken(userId, profileKey) {
    return jwt.sign(
      { userId: userId.toString(), profileKey },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
  }

  // Initiate signup - UPDATED to accept profileKey and fitnessPlanId
  async initiateSignup(email, profileKey, fitnessPlanId = null) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      
      if (existingUser) {
        return {
          success: false,
          message: 'Email already registered. Please login instead.'
        };
      }

      // Check if profileKey already exists
      const existingProfileKey = await User.findOne({ profileKey });
      if (existingProfileKey) {
        return {
          success: false,
          message: 'Profile key already in use by another user'
        };
      }

      // Generate verification code
      const verificationCode = this.generateVerificationCode();
      
      // Store code, profileKey, and fitnessPlanId
      this.storeVerificationData(email, verificationCode, profileKey, fitnessPlanId);
      
      // TODO: Integrate with email service here
      console.log(`Verification code for ${email}: ${verificationCode}`);
      console.log(`Profile key to be linked: ${profileKey}`);
      console.log(`Fitness plan ID to be linked: ${fitnessPlanId || 'None'}`);
      
      return {
        success: true,
        code: verificationCode,
        message: 'Verification code sent successfully'
      };
      
    } catch (error) {
      throw new Error(`Signup initiation failed: ${error.message}`);
    }
  }

  // Complete signup - UPDATED to get profileKey and fitnessPlanId from storage
  async completeSignup(email, code) {
    try {
      // Verify code
      const verification = this.verifyCode(email, code);
      if (!verification.isValid) {
        return {
          success: false,
          message: verification.message
        };
      }

      // Get stored profileKey and fitnessPlanId
      const storedData = signupData.get(email);
      if (!storedData) {
        return {
          success: false,
          message: 'Signup session expired. Please start again.'
        };
      }

      const { profileKey, fitnessPlanId } = storedData;

      // Double-check profileKey is still available
      const existingProfileKey = await User.findOne({ profileKey });
      if (existingProfileKey) {
        signupData.delete(email);
        return {
          success: false,
          message: 'Profile key already in use. Please use a different profile key.'
        };
      }

      // Check if user was created in the meantime
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        signupData.delete(email);
        return {
          success: false,
          message: 'User already exists. Please login instead.'
        };
      }

      // Create new user with fitnessPlanId if provided
      const userData = {
        email,
        profileKey,
        isVerified: true,
        subscriptionStatus: 'free' // Default to free
      };

      if (fitnessPlanId) {
        userData.fitnessPlanId = fitnessPlanId;
      }

      const user = new User(userData);
      await user.save();

      // Clean up temporary data
      signupData.delete(email);

      // Generate token
      const token = this.generateToken(user._id, profileKey);

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          profileKey: user.profileKey,
          fitnessPlanId: user.fitnessPlanId,
          isVerified: user.isVerified,
          subscriptionStatus: user.subscriptionStatus,
          currentSubscription: user.currentSubscription,
          isPaidUser: user.isPaidUser()
        },
        token
      };
      
    } catch (error) {
      throw new Error(`Signup completion failed: ${error.message}`);
    }
  }

  // Initiate login
  async initiateLogin(email) {
    try {
      // Check if user exists
      const user = await User.findOne({ email });
      
      if (!user) {
        return {
          success: false,
          message: 'Email not registered. Please sign up first.'
        };
      }

      if (!user.isVerified) {
        return {
          success: false,
          message: 'Account not verified. Please complete verification.'
        };
      }

      // Generate verification code
      const verificationCode = this.generateVerificationCode();
      
      // Store code (no profileKey needed for login)
      this.storeVerificationData(email, verificationCode);
      
      // TODO: Integrate with email service here
      console.log(`Login verification code for ${email}: ${verificationCode}`);
      
      return {
        success: true,
        code: verificationCode,
        profileKey: user.profileKey,
        message: 'Verification code sent successfully'
      };
      
    } catch (error) {
      throw new Error(`Login initiation failed: ${error.message}`);
    }
  }

  // Complete login
  async completeLogin(email, code) {
    try {
      // Verify code
      const verification = this.verifyCode(email, code);
      if (!verification.isValid) {
        return {
          success: false,
          message: verification.message
        };
      }

      // Get user
      const user = await User.findOne({ email });
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Generate token
      const token = this.generateToken(user._id, user.profileKey);

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          profileKey: user.profileKey,
          fitnessPlanId: user.fitnessPlanId,
          isVerified: user.isVerified,
          subscriptionStatus: user.subscriptionStatus,
          currentSubscription: user.currentSubscription,
          isPaidUser: user.isPaidUser()
        },
        token
      };

    } catch (error) {
      throw new Error(`Login completion failed: ${error.message}`);
    }
  }

  // Link profile to user
  async linkProfileToUser(email, profileKey) {
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        throw new Error('User not found');
      }

      // Check if profileKey already exists
      const existingUserWithProfileKey = await User.findOne({ profileKey });
      if (existingUserWithProfileKey && existingUserWithProfileKey.email !== email) {
        throw new Error('Profile key already in use by another user');
      }

      user.profileKey = profileKey;
      await user.save();

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          profileKey: user.profileKey,
          fitnessPlanId: user.fitnessPlanId,
          subscriptionStatus: user.subscriptionStatus
        }
      };

    } catch (error) {
      throw new Error(`Profile linking failed: ${error.message}`);
    }
  }

  // Get authenticated user by profile key
  async getAuthUserByProfileKey(profileKey) {
    try {
      const user = await User.findOne({ profileKey }).select('-__v');
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          profileKey: user.profileKey,
          fitnessPlanId: user.fitnessPlanId,
          remarks: user.remarks,
          isVerified: user.isVerified,
          subscriptionStatus: user.subscriptionStatus,
          currentSubscription: user.currentSubscription,
          isPaidUser: user.isPaidUser(),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      };
    } catch (error) {
      throw new Error(`Failed to get user by profile key: ${error.message}`);
    }
  }

  // Add fitness plan to user - NEW FUNCTION
  async addFitnessPlanToUser(userId, fitnessPlanId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Add fitness plan (doesn't matter if they already have one)
      user.fitnessPlanId = fitnessPlanId;
      await user.save();

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          profileKey: user.profileKey,
          fitnessPlanId: user.fitnessPlanId,
          subscriptionStatus: user.subscriptionStatus
        }
      };

    } catch (error) {
      throw new Error(`Failed to add fitness plan: ${error.message}`);
    }
  }

  // Update fitness plan for user - NEW FUNCTION
  async updateFitnessPlanForUser(userId, fitnessPlanId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Update fitness plan
      user.fitnessPlanId = fitnessPlanId;
      await user.save();

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          profileKey: user.profileKey,
          fitnessPlanId: user.fitnessPlanId,
          subscriptionStatus: user.subscriptionStatus
        }
      };

    } catch (error) {
      throw new Error(`Failed to update fitness plan: ${error.message}`);
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email }).select('-__v');
      return user;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-__v');
      
      if (!user) {
        return null;
      }
      
      // Populate current subscription if exists
      let currentSubscriptionDetails = null;
      if (user.currentSubscription) {
        currentSubscriptionDetails = await Subscription.findById(user.currentSubscription)
          .populate('package', 'name duration price')
          .select('-__v');
      }
      
      const userObj = user.toObject();
      userObj.currentSubscriptionDetails = currentSubscriptionDetails;
      
      return userObj;
    } catch (error) {
      console.error('Error in getUserById:', error);
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Get user by profile key
  async getUserByProfileKey(profileKey) {
    try {
      const user = await User.findOne({ profileKey }).select('-__v');
      return user;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Update user subscription (used by subscription service)
  async updateUserSubscription(userId, subscriptionData) {
    try {
      const user = await User.updateUserSubscription(userId, subscriptionData);
      
      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          subscriptionStatus: user.subscriptionStatus,
          currentSubscription: user.currentSubscription,
          isPaidUser: user.isPaidUser()
        }
      };
    } catch (error) {
      throw new Error(`Failed to update user subscription: ${error.message}`);
    }
  }

  // Clear user subscription (when cancelled or expired)
  async clearUserSubscription(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      user.clearSubscription();
      await user.save();
      
      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          subscriptionStatus: user.subscriptionStatus,
          currentSubscription: user.currentSubscription
        }
      };
    } catch (error) {
      throw new Error(`Failed to clear user subscription: ${error.message}`);
    }
  }

  // Search users
  async searchUsers(searchTerm, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const query = {
        $or: [
          { email: { $regex: searchTerm, $options: 'i' } },
          { profileKey: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      const users = await User.find(query)
        .select('-__v')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // Delete user
  async deleteUser(email) {
    try {
      const result = await User.deleteOne({ email });
      
      if (result.deletedCount === 0) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Clean up any temporary data
      verificationCodes.delete(email);
      signupData.delete(email);

      return {
        success: true,
        message: 'User deleted successfully'
      };

    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }
}

module.exports = new AuthService();