const mongoose = require('mongoose');

const goalBaseProgramSchema = new mongoose.Schema({
    // ==================== Workout Selection ====================
    selectedWorkout: {
        type: String,
        trim: true
    },

    // ==================== Body Type Selection ====================
    currentBodyType: {
        type: String,
        trim: true
    },
    
    goalBodyType: {
        type: String,
        trim: true
    },

    // ==================== Target Areas ====================
    targetAreas: [{
        type: String,
        trim: true
    }],

    // ==================== Health Satisfaction ====================
    healthSatisfactionStatus: {
        type: String,
        trim: true
    },

    // ==================== Exercise Motivations ====================
    exerciseMotivations: [{
        type: String,
        trim: true
    }],

    // ==================== Fitness Details ====================
    fitnessLevel: {
        type: Number,
        min: 1,
        max: 10
    },
    
    pushupsCapability: {
        type: String,
        trim: true
    },
    
    sedentaryLifestyle: {
        type: Boolean
    },
    
    walkingDuration: {
        type: String,
        trim: true
    },
    
    sleepDuration: {
        type: String,
        trim: true
    },
    
    waterIntake: {
        type: String,
        trim: true
    },
    
    mealFeelings: {
        type: String,
        trim: true
    },
    
    dietaryType: {
        type: String,
        trim: true
    },
    
    organizationLevel: {
        type: String,
        trim: true
    },

    // ==================== Habits ====================
    habits: [{
        type: String,
        trim: true
    }],

    // ==================== Equipment ====================
    equipmentAvailability: {
        type: String,
        trim: true
    },

    // ==================== Workout Preferences ====================
    workoutDaysPerWeek: {
        type: Number,
        min: 1,
        max: 7
    },
    
    workoutDurationMinutes: {
        type: Number,
        min: 10,
        max: 300
    },

    // ==================== Goals ====================
    primaryGoal: {
        type: String,
        trim: true
    },

    // ==================== Fitness Experience ====================
    fitnessExperience: {
        type: String,
        trim: true
    },

    // ==================== Workout History ====================
    workoutHistory: {
        type: String,
        trim: true
    },

    // ==================== Health Conditions & Injuries ====================
    healthConditions: [{
        type: String,
        trim: true
    }],
    
    injuries: [{
        type: String,
        trim: true
    }],

    // ==================== Preferences ====================
    dietaryPreference: {
        type: String,
        trim: true
    },
    
    hasGymAccess: {
        type: Boolean,
        default: false
    },
    
    availableEquipment: [{
        type: String,
        trim: true
    }],

    // ==================== Metadata ====================
    metadata: {
        profileComplete: {
            type: Boolean,
            default: false
        },
        completionPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        filledFieldsCount: {
            type: Number,
            default: 0
        },
        missingFields: [{
            type: String
        }],
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for faster queries
goalBaseProgramSchema.index({ 'metadata.profileComplete': 1 });
goalBaseProgramSchema.index({ createdAt: -1 });

const GoalBaseProgram = mongoose.model('GoalBaseProgram', goalBaseProgramSchema);

module.exports = GoalBaseProgram;