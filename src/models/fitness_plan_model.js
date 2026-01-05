const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: String,
  description: String,
  steps: [String],
  setsReps: String,
  tips: [String]
}, { _id: false });

const workoutSchema = new mongoose.Schema({
  focus: String,
  caloriesBurned: Number,
  intensity: String,
  warmup: {
    description: String,
    duration: String
  },
  exercises: [exerciseSchema],
  cooldown: {
    description: String,
    duration: String
  }
}, { _id: false });

const nutritionSchema = new mongoose.Schema({
  breakfast: {
    description: String,
    calories: Number
  },
  lunch: {
    description: String,
    calories: Number
  },
  dinner: {
    description: String,
    calories: Number
  },
  snack: {
    description: String,
    calories: Number
  },
  totalCalories: Number,
  explanation: String
}, { _id: false });

const daySchema = new mongoose.Schema({
  day: Number,
  type: String, // 'workout' or 'rest'
  workout: workoutSchema,
  nutrition: nutritionSchema
}, { _id: false });

const planStructureSchema = new mongoose.Schema({
  overview: {
    totalDays: Number,
    activeDays: Number,
    restDays: Number,
    estimatedWeeklyCaloriesBurned: Number
  },
  days: [daySchema],
  safetyNotes: [String]
}, { _id: false });

const fitnessPlanSchema = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  plan: {
    type: planStructureSchema,
    required: true
  },
  planType: {
    type: String,
    enum: ['adaptive', 'goalBased'],
    required: true
  },
  generatedAt: {
    type: Date,
    default: () => new Date() // or default: () => Date.now()
  },
  // Store snapshot of profile data used for generation
  profileSnapshot: {
    gender: String,
    age: Number,
    heightCm: Number,
    currentWeightKg: Number,
    targetWeightKg: Number,
    commitment: String,
    workoutDays: [String]
  },
  // Store snapshot of program data
  programSnapshot: {
    type: mongoose.Schema.Types.Mixed // Can store either adaptive or goalBased data
  }
}, {
  timestamps: true
});

// Index for faster queries
fitnessPlanSchema.index({ profileId: 1 });
fitnessPlanSchema.index({ generatedAt: -1 });

const FitnessPlan = mongoose.model('FitnessPlan', fitnessPlanSchema);

module.exports = FitnessPlan;