const GoalBaseProgram = require('../models/goal_base_program_model');

class GoalBaseProgramValidators {
    
    // Validate required fields exist
    static validateRequiredFields(programData) {
        const requiredFields = [
            'selectedWorkout',
            'currentBodyType',
            'goalBodyType',
            'targetAreas',
            'healthSatisfactionStatus',
            'fitnessExperience',
            'workoutHistory',
            'fitnessLevel',
            'pushupsCapability',
            'sedentaryLifestyle',
            'walkingDuration',
            'sleepDuration',
            'waterIntake',
            'mealFeelings',
            'dietaryType',
            'organizationLevel',
            'habits',
            'equipmentAvailability'
        ];
        
        const missingFields = [];
        
        for (const field of requiredFields) {
            if (!programData[field] || 
                (Array.isArray(programData[field]) && programData[field].length === 0)) {
                missingFields.push(field);
            }
        }
        
        return {
            isValid: missingFields.length === 0,
            missingFields
        };
    }
    
    // Validate data types match model
    static validateDataTypes(programData) {
        const modelPaths = GoalBaseProgram.schema.paths;
        const errors = [];
        
        for (const [key, value] of Object.entries(programData)) {
            if (modelPaths[key]) {
                const schemaType = modelPaths[key].instance;
                
                // Check if value matches schema type
                switch (schemaType) {
                    case 'String':
                        if (typeof value !== 'string') {
                            errors.push(`${key} should be a string`);
                        }
                        break;
                    case 'Number':
                        if (typeof value !== 'number') {
                            errors.push(`${key} should be a number`);
                        }
                        break;
                    case 'Boolean':
                        if (typeof value !== 'boolean') {
                            errors.push(`${key} should be a boolean`);
                        }
                        break;
                    case 'Array':
                        if (!Array.isArray(value)) {
                            errors.push(`${key} should be an array`);
                        }
                        break;
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    // Calculate completion percentage
    static calculateCompletion(programData) {
        const totalFields = 23; // From frontend controller
        const requiredFields = [
            'selectedWorkout',
            'currentBodyType',
            'goalBodyType',
            'targetAreas',
            'healthSatisfactionStatus',
            'fitnessExperience',
            'workoutHistory',
            'fitnessLevel',
            'pushupsCapability',
            'sedentaryLifestyle',
            'walkingDuration',
            'sleepDuration',
            'waterIntake',
            'mealFeelings',
            'dietaryType',
            'organizationLevel',
            'habits',
            'equipmentAvailability'
        ];
        
        let filledCount = 0;
        
        for (const field of requiredFields) {
            if (programData[field] !== undefined && 
                programData[field] !== null &&
                !(Array.isArray(programData[field]) && programData[field].length === 0)) {
                filledCount++;
            }
        }
        
        // Add optional fields that might be filled
        const optionalFields = [
            'exerciseMotivations',
            'workoutDaysPerWeek',
            'workoutDurationMinutes',
            'primaryGoal',
            'healthConditions',
            'injuries',
            'dietaryPreference',
            'hasGymAccess',
            'availableEquipment'
        ];
        
        for (const field of optionalFields) {
            if (programData[field] !== undefined && 
                programData[field] !== null &&
                !(Array.isArray(programData[field]) && programData[field].length === 0)) {
                filledCount++;
            }
        }
        
        return {
            filledFields: filledCount,
            totalFields: totalFields + optionalFields.length,
            percentage: Math.round((filledCount / (totalFields + optionalFields.length)) * 100),
            isComplete: filledCount >= totalFields // At least all required fields
        };
    }
    
    // Prepare data for saving
    static prepareDataForSave(programData) {
        const preparedData = {};
        
        // Only include fields that exist in our model
        const modelFields = Object.keys(GoalBaseProgram.schema.paths);
        
        for (const [key, value] of Object.entries(programData)) {
            if (modelFields.includes(key) && value !== undefined) {
                preparedData[key] = value;
            }
        }
        
        // Calculate metadata
        const completion = this.calculateCompletion(preparedData);
        const requiredValidation = this.validateRequiredFields(preparedData);
        
        preparedData.metadata = {
            profileComplete: requiredValidation.isValid,
            completionPercentage: completion.percentage,
            filledFieldsCount: completion.filledFields,
            missingFields: requiredValidation.missingFields,
            lastUpdated: new Date()
        };
        
        return preparedData;
    }
}

module.exports = GoalBaseProgramValidators;