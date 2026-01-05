const mongoose = require('mongoose');

const dayProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fitnessPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessPlan',
    required: true
  },
  day: {
    type: Number,
    required: true,
    min: 1
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  dayType: {
    type: String,
    enum: ['workout', 'rest'],
    required: true
  },
  // Exercise Progress
  exerciseProgress: {
    totalExercises: {
      type: Number,
      default: 0
    },
    completedExercises: {
      type: Number,
      default: 0
    },
    skippedExercises: {
      type: Number,
      default: 0
    },
    pendingExercises: {
      type: Number,
      default: 0
    },
    completionPercentage: {
      type: Number,
      default: 0
    },
    exercises: [{
      exerciseNumber: Number,
      exerciseName: String,
      targetSetsReps: String,
      status: {
        type: String,
        enum: ['completed', 'skipped', 'pending'],
        default: 'pending'
      },
      actualSets: Number,
      actualReps: Number,
      skipReason: String,
      logId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExerciseLog'
      }
    }]
  },
  // Nutrition Progress
  nutritionProgress: {
    totalMeals: {
      type: Number,
      default: 4 // breakfast, lunch, dinner, snack
    },
    completedMeals: {
      type: Number,
      default: 0
    },
    skippedMeals: {
      type: Number,
      default: 0
    },
    pendingMeals: {
      type: Number,
      default: 0
    },
    completionPercentage: {
      type: Number,
      default: 0
    },
    targetCalories: {
      type: Number,
      default: 0
    },
    consumedCalories: {
      type: Number,
      default: 0
    },
    caloriesPercentage: {
      type: Number,
      default: 0
    },
    meals: {
      breakfast: {
        targetDescription: String,
        targetCalories: Number,
        status: {
          type: String,
          enum: ['completed', 'skipped', 'pending'],
          default: 'pending'
        },
        actualDescription: String,
        actualCalories: Number,
        skipReason: String,
        completedAt: Date
      },
      lunch: {
        targetDescription: String,
        targetCalories: Number,
        status: {
          type: String,
          enum: ['completed', 'skipped', 'pending'],
          default: 'pending'
        },
        actualDescription: String,
        actualCalories: Number,
        skipReason: String,
        completedAt: Date
      },
      dinner: {
        targetDescription: String,
        targetCalories: Number,
        status: {
          type: String,
          enum: ['completed', 'skipped', 'pending'],
          default: 'pending'
        },
        actualDescription: String,
        actualCalories: Number,
        skipReason: String,
        completedAt: Date
      },
      snack: {
        targetDescription: String,
        targetCalories: Number,
        status: {
          type: String,
          enum: ['completed', 'skipped', 'pending'],
          default: 'pending'
        },
        actualDescription: String,
        actualCalories: Number,
        skipReason: String,
        completedAt: Date
      }
    }
  },
  // Overall Progress
  overallProgress: {
    isExerciseComplete: {
      type: Boolean,
      default: false
    },
    isNutritionComplete: {
      type: Boolean,
      default: false
    },
    isDayComplete: {
      type: Boolean,
      default: false
    },
    completionPercentage: {
      type: Number,
      default: 0
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes
dayProgressSchema.index({ userId: 1, day: 1 }, { unique: true });
dayProgressSchema.index({ userId: 1, date: 1 });
dayProgressSchema.index({ fitnessPlanId: 1, day: 1 });

// Method to calculate overall progress
dayProgressSchema.methods.calculateProgress = function() {
  // Exercise completion - count both completed AND skipped as "done"
  if (this.dayType === 'workout') {
    const doneExercises = this.exerciseProgress.completedExercises + 
                          this.exerciseProgress.skippedExercises;
    
    this.exerciseProgress.completionPercentage = this.exerciseProgress.totalExercises > 0
      ? Math.round((doneExercises / this.exerciseProgress.totalExercises) * 100)
      : 0;
    
    // If nothing is pending, exercises are complete (skipped counts as complete)
    this.overallProgress.isExerciseComplete = 
      this.exerciseProgress.pendingExercises === 0 &&
      this.exerciseProgress.totalExercises > 0;
  } else {
    // Rest day - exercise automatically complete
    this.overallProgress.isExerciseComplete = true;
    this.exerciseProgress.completionPercentage = 100;
  }

  // Nutrition completion - count both completed AND skipped as "done"
  const doneMeals = this.nutritionProgress.completedMeals + 
                    this.nutritionProgress.skippedMeals;
  
  this.nutritionProgress.completionPercentage = this.nutritionProgress.totalMeals > 0
    ? Math.round((doneMeals / this.nutritionProgress.totalMeals) * 100)
    : 0;

  this.nutritionProgress.caloriesPercentage = this.nutritionProgress.targetCalories > 0
    ? Math.round((this.nutritionProgress.consumedCalories / this.nutritionProgress.targetCalories) * 100)
    : 0;

  // If nothing is pending, nutrition is complete (skipped counts as complete)
  this.overallProgress.isNutritionComplete = 
    this.nutritionProgress.pendingMeals === 0;

  // Overall day completion
  this.overallProgress.isDayComplete = 
    this.overallProgress.isExerciseComplete && 
    this.overallProgress.isNutritionComplete;

  // Overall percentage (50% exercise, 50% nutrition)
  this.overallProgress.completionPercentage = Math.round(
    (this.exerciseProgress.completionPercentage + this.nutritionProgress.completionPercentage) / 2
  );

  this.lastUpdated = new Date();
};

const DayProgress = mongoose.model('DayProgress', dayProgressSchema);

module.exports = DayProgress;