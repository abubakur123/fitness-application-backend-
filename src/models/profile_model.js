const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  // Basic User Information
  gender: {
    type: String,
    // enum: ['male', 'female', 'other'],
    default: null
  },
  age: {
    type: Number,
    min: 1,
    max: 150,
    default: null
  },
  heightCm: {
    type: Number,
    min: 1,
    default: null
  },
  isMetricHeight: {
    type: Boolean,
    default: true
  },
  currentWeightKg: {
    type: Number,
    min: 1,
    default: null
  },
  targetWeightKg: {
    type: Number,
    min: 1,
    default: null
  },
  commitment: {
    type: String,
    // enum: ['casual', 'moderate', 'dedicated'],
    default: null
  },
  workoutDays: {
    type: [String],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    default: []
  },
  
  // Program References (user can have only one of these)
  adaptiveProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdaptiveProfile',
    default: null
  },
  goalBasedProgram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoalBaseProgram',  // ← CHANGE THIS LINE
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Validation: Ensure only one program type is set
profileSchema.pre('save', function() {
  if (this.adaptiveProfile && this.goalBasedProgram) {
    throw new Error('Profile can have either adaptiveProfile or goalBasedProgram, not both');
  }
});

// Index for faster queries
profileSchema.index({ adaptiveProfile: 1 });
profileSchema.index({ goalBasedProgram: 1 });

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;