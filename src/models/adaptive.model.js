const mongoose = require('mongoose');

const adaptiveProfileSchema = new mongoose.Schema(
  {
    affectedLimbs: {
      type: String,
      required: true,
      trim: true,
    },
    purposes: {
      type: [String],
      required: true,
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'At least one purpose is required'
      }
    },
    isComplete: {
      type: Boolean,
      default: false
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Index for faster queries
adaptiveProfileSchema.index({ createdAt: -1 });

// Method to calculate completion
adaptiveProfileSchema.methods.calculateCompletion = function() {
  let completedSteps = 0;
  const totalSteps = 2;

  if (this.affectedLimbs && this.affectedLimbs.length > 0) completedSteps++;
  if (this.purposes && this.purposes.length > 0) completedSteps++;

  this.completionPercentage = (completedSteps / totalSteps) * 100;
  this.isComplete = this.completionPercentage === 100;
};


// Pre-save middleware to calculate completion
adaptiveProfileSchema.pre('save', async function() {
  console.log('Pre-save middleware running');
  this.calculateCompletion();
  // No next() needed - Mongoose handles it automatically
});

const AdaptiveProfile = mongoose.model('AdaptiveProfile', adaptiveProfileSchema);

module.exports = AdaptiveProfile;