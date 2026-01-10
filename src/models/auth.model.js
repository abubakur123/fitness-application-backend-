const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  profileKey: {
    type: String,
    unique: true,
    sparse: true
  },
  fitnessPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessPlan',
    default: null
  },
  remarks: {
    type: String,
    trim: true,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  subscriptionStatus: {
    type: String,
    enum: ['free', 'active', 'expired', 'cancelled', 'pending'],
    default: 'free'
  },
  currentSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },
  // NEW: Google OAuth fields
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  googleProfile: {
    name: String,
    firebase_uid: String,
    email_verified: Boolean
  },
  authProvider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

// Method to check if user is a paid user
userSchema.methods.isPaidUser = function() {
  return this.subscriptionStatus === 'active';
};

// Method to get current subscription info
userSchema.methods.getSubscriptionInfo = function() {
  return {
    isPaidUser: this.isPaidUser(),
    subscriptionStatus: this.subscriptionStatus,
    currentSubscription: this.currentSubscription,
    hasActiveSubscription: this.subscriptionStatus === 'active'
  };
};

// Method to get user profile for responses
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    email: this.email,
    profileKey: this.profileKey,
    fitnessPlanId: this.fitnessPlanId,
    remarks: this.remarks,
    isVerified: this.isVerified,
    subscriptionStatus: this.subscriptionStatus,
    currentSubscription: this.currentSubscription,
    isPaidUser: this.isPaidUser(),
    authProvider: this.authProvider,
    googleProfile: this.googleProfile,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Method to update subscription status
userSchema.methods.updateSubscriptionStatus = function(subscriptionId, status) {
  this.currentSubscription = subscriptionId;
  this.subscriptionStatus = status;
  this.updatedAt = Date.now();
};

// Method to clear subscription (when cancelled or expired)
userSchema.methods.clearSubscription = function() {
  this.currentSubscription = null;
  this.subscriptionStatus = 'free';
  this.updatedAt = Date.now();
};

// Static method to update subscription for user
userSchema.statics.updateUserSubscription = async function(userId, subscriptionData) {
  const user = await this.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  const { subscriptionId, status } = subscriptionData;
  
  if (subscriptionId) {
    user.currentSubscription = subscriptionId;
  }
  
  if (status) {
    user.subscriptionStatus = status;
  }
  
  user.updatedAt = Date.now();
  await user.save();
  return user;
};

module.exports = mongoose.model('User', userSchema);