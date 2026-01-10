const User = require('../models/auth.model');
const jwt = require('jsonwebtoken');
const Subscription = require('../models/subscription_model');

// In-memory stores (use Redis in production)
const verificationCodes = new Map();
const signupData = new Map();
const CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes

class AuthService {
  // Generate random 4-digit code
  generateVerificationCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Store verification data with email, profileKey, and fitnessPlanId
  storeVerificationData(email, code, profileKey = null, fitnessPlanId = null) {
    const expiry = Date.now() + CODE_EXPIRY;
    
    verificationCodes.set(email, { code, expiry });
    
    if (profileKey) {
      signupData.set(email, { profileKey, fitnessPlanId, expiry });
    }
    
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

  // ========== NEW: GOOGLE OAUTH METHODS ==========
  
  // Google login/signup
  async googleAuth(googleData) {
    try {
      const { google_id, email, display_name, firebase_uid, email_verified, profileKey, fitnessPlanId } = googleData;

      // Support both snake_case (from Google) and camelCase (for backwards compatibility)
      const googleId = google_id || googleData.googleId;
      const name = display_name || googleData.name;

      if (!googleId || !email) {
        return {
          success: false,
          message: 'Google ID and email are required'
        };
      }

      // Check if profileKey is already in use by another user
      if (profileKey) {
        const existingProfileKey = await User.findOne({ 
          profileKey,
          email: { $ne: email } // Different email
        });
        
        if (existingProfileKey) {
          return {
            success: false,
            message: 'Profile key already in use by another user'
          };
        }
      }

      // Check if user exists by googleId
      let user = await User.findOne({ googleId });

      if (user) {
        // Existing Google user - update profile if needed
        let updated = false;

        if (profileKey && user.profileKey !== profileKey) {
          user.profileKey = profileKey;
          updated = true;
        }

        if (fitnessPlanId && user.fitnessPlanId !== fitnessPlanId) {
          user.fitnessPlanId = fitnessPlanId;
          updated = true;
        }

        if (name && user.googleProfile?.name !== name) {
          user.googleProfile = {
            name,
            firebase_uid: firebase_uid || user.googleProfile?.firebase_uid,
            email_verified: email_verified !== undefined ? email_verified : user.googleProfile?.email_verified
          };
          updated = true;
        }

        if (updated) {
          await user.save();
        }

        const token = this.generateToken(user._id, user.profileKey);

        return {
          success: true,
          isNewUser: false,
          user: {
            id: user._id,
            email: user.email,
            profileKey: user.profileKey,
            fitnessPlanId: user.fitnessPlanId,
            isVerified: user.isVerified,
            subscriptionStatus: user.subscriptionStatus,
            currentSubscription: user.currentSubscription,
            isPaidUser: user.isPaidUser(),
            authProvider: user.authProvider,
            googleProfile: user.googleProfile
          },
          token
        };
      }

      // Check if user exists by email (might have signed up via email before)
      user = await User.findOne({ email });

      if (user) {
        // User exists with email auth - link Google account
        if (user.googleId && user.googleId !== googleId) {
          return {
            success: false,
            message: 'Email already linked to another Google account'
          };
        }

        user.googleId = googleId;
        user.authProvider = 'google';
        user.googleProfile = {
          name,
          firebase_uid,
          email_verified
        };
        user.isVerified = true; // Google users are auto-verified

        if (profileKey) {
          user.profileKey = profileKey;
        }

        if (fitnessPlanId) {
          user.fitnessPlanId = fitnessPlanId;
        }

        await user.save();

        const token = this.generateToken(user._id, user.profileKey);

        return {
          success: true,
          isNewUser: false,
          linkedExisting: true,
          user: {
            id: user._id,
            email: user.email,
            profileKey: user.profileKey,
            fitnessPlanId: user.fitnessPlanId,
            isVerified: user.isVerified,
            subscriptionStatus: user.subscriptionStatus,
            currentSubscription: user.currentSubscription,
            isPaidUser: user.isPaidUser(),
            authProvider: user.authProvider,
            googleProfile: user.googleProfile
          },
          token
        };
      }

      // New user - create account
      const userData = {
        email,
        googleId,
        authProvider: 'google',
        isVerified: true, // Google users are auto-verified
        subscriptionStatus: 'free',
        googleProfile: {
          name,
          firebase_uid,
          email_verified
        }
      };

      if (profileKey) {
        userData.profileKey = profileKey;
      }

      if (fitnessPlanId) {
        userData.fitnessPlanId = fitnessPlanId;
      }

      user = new User(userData);
      await user.save();

      const token = this.generateToken(user._id, user.profileKey);

      return {
        success: true,
        isNewUser: true,
        user: {
          id: user._id,
          email: user.email,
          profileKey: user.profileKey,
          fitnessPlanId: user.fitnessPlanId,
          isVerified: user.isVerified,
          subscriptionStatus: user.subscriptionStatus,
          currentSubscription: user.currentSubscription,
          isPaidUser: user.isPaidUser(),
          authProvider: user.authProvider,
          googleProfile: user.googleProfile
        },
        token
      };

    } catch (error) {
      throw new Error(`Google authentication failed: ${error.message}`);
    }
  }

  // ========== EXISTING METHODS (UNCHANGED) ==========

  async initiateSignup(email, profileKey, fitnessPlanId = null) {
    try {
      const existingUser = await User.findOne({ email });
      
      if (existingUser) {
        return {
          success: false,
          message: 'Email already registered. Please login instead.'
        };
      }

      const existingProfileKey = await User.findOne({ profileKey });
      if (existingProfileKey) {
        return {
          success: false,
          message: 'Profile key already in use by another user'
        };
      }

      const verificationCode = this.generateVerificationCode();
      this.storeVerificationData(email, verificationCode, profileKey, fitnessPlanId);
      
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

  async completeSignup(email, code) {
    try {
      const verification = this.verifyCode(email, code);
      if (!verification.isValid) {
        return {
          success: false,
          message: verification.message
        };
      }

      const storedData = signupData.get(email);
      if (!storedData) {
        return {
          success: false,
          message: 'Signup session expired. Please start again.'
        };
      }

      const { profileKey, fitnessPlanId } = storedData;

      const existingProfileKey = await User.findOne({ profileKey });
      if (existingProfileKey) {
        signupData.delete(email);
        return {
          success: false,
          message: 'Profile key already in use. Please use a different profile key.'
        };
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        signupData.delete(email);
        return {
          success: false,
          message: 'User already exists. Please login instead.'
        };
      }

      const userData = {
        email,
        profileKey,
        isVerified: true,
        subscriptionStatus: 'free',
        authProvider: 'email'
      };

      if (fitnessPlanId) {
        userData.fitnessPlanId = fitnessPlanId;
      }

      const user = new User(userData);
      await user.save();

      signupData.delete(email);

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
          isPaidUser: user.isPaidUser(),
          authProvider: user.authProvider,
          googleProfile: user.googleProfile || null
        },
        token
      };
      
    } catch (error) {
      throw new Error(`Signup completion failed: ${error.message}`);
    }
  }

  async initiateLogin(email) {
    try {
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

      const verificationCode = this.generateVerificationCode();
      this.storeVerificationData(email, verificationCode);
      
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

  async completeLogin(email, code) {
    try {
      const verification = this.verifyCode(email, code);
      if (!verification.isValid) {
        return {
          success: false,
          message: verification.message
        };
      }

      const user = await User.findOne({ email });
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

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
          isPaidUser: user.isPaidUser(),
          authProvider: user.authProvider,
          googleProfile: user.googleProfile || null
        },
        token
      };

    } catch (error) {
      throw new Error(`Login completion failed: ${error.message}`);
    }
  }

  async linkProfileToUser(email, profileKey) {
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        throw new Error('User not found');
      }

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
          authProvider: user.authProvider,
          googleProfile: user.googleProfile,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      };
    } catch (error) {
      throw new Error(`Failed to get user by profile key: ${error.message}`);
    }
  }

  async addFitnessPlanToUser(userId, fitnessPlanId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

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

  async updateFitnessPlanForUser(userId, fitnessPlanId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

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

  async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email }).select('-__v');
      return user;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-__v');
      
      if (!user) {
        return null;
      }
      
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

  async getUserByProfileKey(profileKey) {
    try {
      const user = await User.findOne({ profileKey }).select('-__v');
      return user;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

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

  async deleteUser(email) {
    try {
      const result = await User.deleteOne({ email });
      
      if (result.deletedCount === 0) {
        return {
          success: false,
          message: 'User not found'
        };
      }

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