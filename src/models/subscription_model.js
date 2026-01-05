const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'google_pay', 'apple_pay', 'paypal', 'bank_transfer', 'other'],
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  packagePrice: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isTrial: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ expiryDate: 1 });
subscriptionSchema.index({ transactionId: 1 });

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && this.expiryDate > new Date();
};

// Method to get remaining days
subscriptionSchema.methods.getRemainingDays = function() {
  if (!this.isActive()) return 0;
  const now = new Date();
  const diffTime = this.expiryDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Method to get subscription info
subscriptionSchema.methods.getSubscriptionInfo = function() {
  return {
    isActive: this.isActive(),
    status: this.status,
    startDate: this.startDate,
    expiryDate: this.expiryDate,
    remainingDays: this.getRemainingDays(),
    package: this.package,
    paymentMethod: this.paymentMethod,
    amountPaid: this.amountPaid
  };
};

module.exports = mongoose.model('Subscription', subscriptionSchema);