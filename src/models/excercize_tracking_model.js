const mongoose = require('mongoose');

const exerciseLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  dayNumber: {
    type: Number,
    required: true,
    min: 1
  },
  exerciseNumber: {
    type: Number,
    required: true,
    min: 1
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  exerciseName: {
    type: String,
    required: true,
    trim: true
  },
  targetSetsReps: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'skipped'],
    required: true
  },
  // For completed exercises
  actualSets: {
    type: Number,
    required: function() {
      return this.status === 'completed';
    }
  },
  actualReps: {
    type: Number,
    required: function() {
      return this.status === 'completed';
    }
  },
  // For skipped exercises
  skipReason: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Compound indexes for faster queries
exerciseLogSchema.index({ userId: 1, date: -1 });
exerciseLogSchema.index({ userId: 1, dayNumber: 1, exerciseNumber: 1 });

const ExerciseLog = mongoose.model('ExerciseLog', exerciseLogSchema);

module.exports = ExerciseLog;