const mongoose = require('mongoose');

const nutritionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  day: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  totalCalories: {
    type: Number,
    required: true,
    default: 0  // Add default value
  },
  meals: {
    breakfast: {
      description: String,
      calories: Number,
      status: {
        type: String,
        enum: ['pending', 'completed', 'skipped'],
        default: 'pending'
      },
      skipReason: String,
      completedAt: Date
    },
    lunch: {
      description: String,
      calories: Number,
      status: {
        type: String,
        enum: ['pending', 'completed', 'skipped'],
        default: 'pending'
      },
      skipReason: String,
      completedAt: Date
    },
    dinner: {
      description: String,
      calories: Number,
      status: {
        type: String,
        enum: ['pending', 'completed', 'skipped'],
        default: 'pending'
      },
      skipReason: String,
      completedAt: Date
    },
    snack: {
      description: String,
      calories: Number,
      status: {
        type: String,
        enum: ['pending', 'completed', 'skipped'],
        default: 'pending'
      },
      skipReason: String,
      completedAt: Date
    }
  },
  explanation: String,
  consumedCalories: {
    type: Number,
    default: 0
  },
  isRestDay: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true  // This automatically adds createdAt and updatedAt
});

// Index for efficient queries
nutritionSchema.index({ userId: 1, date: 1 }, { unique: true });
nutritionSchema.index({ userId: 1, day: 1 });

// Calculate consumed calories before saving
nutritionSchema.pre('save', function() {
  let totalConsumed = 0;
  
  // Only count calories for completed meals
  if (this.meals) {
    Object.values(this.meals).forEach(meal => {
      if (meal && meal.status === 'completed') {
        totalConsumed += meal.calories || 0;
      }
    });
  }
  
  this.consumedCalories = totalConsumed;
  // Remove next() call and manual updatedAt
  // timestamps: true handles updatedAt automatically
});

module.exports = mongoose.model('Nutrition', nutritionSchema);