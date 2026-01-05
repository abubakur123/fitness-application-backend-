const GoalBaseProgram = require('../models/goal_base_program_model');
const GoalBaseProgramValidators = require('../utils/goal_base_program_validator');

class GoalBaseProgramService {
    
    // Create new GoalBase program (no user ID needed)
    async createProgram(programData) {
        try {
            // Prepare and validate data
            const preparedData = GoalBaseProgramValidators.prepareDataForSave(programData);
            
            // Create new program
            const program = new GoalBaseProgram(preparedData);
            
            await program.save();
            return this.formatProgramResponse(program);
        } catch (error) {
            throw error;
        }
    }
    
    // Get program by ID
    async getProgramById(programId) {
        try {
            const program = await GoalBaseProgram.findById(programId);
            
            if (!program) {
                throw new Error('GoalBase program not found');
            }
            
            return this.formatProgramResponse(program);
        } catch (error) {
            throw error;
        }
    }
    
    // Update entire program
    async updateProgram(programId, programData) {
        try {
            // Prepare and validate data
            const preparedData = GoalBaseProgramValidators.prepareDataForSave(programData);
            
            const program = await GoalBaseProgram.findByIdAndUpdate(
                programId,
                { $set: preparedData },
                { new: true, runValidators: true }
            );
            
            if (!program) {
                throw new Error('GoalBase program not found');
            }
            
            return this.formatProgramResponse(program);
        } catch (error) {
            throw error;
        }
    }
    
    // Update specific fields
    async updateProgramPartial(programId, updateData) {
        try {
            // Get existing program
            const existingProgram = await GoalBaseProgram.findById(programId);
            
            if (!existingProgram) {
                throw new Error('GoalBase program not found');
            }
            
            // Merge with existing data
            const mergedData = {
                ...existingProgram.toObject(),
                ...updateData
            };
            
            // Prepare and validate merged data
            const preparedData = GoalBaseProgramValidators.prepareDataForSave(mergedData);
            
            const program = await GoalBaseProgram.findByIdAndUpdate(
                programId,
                { $set: preparedData },
                { new: true, runValidators: true }
            );
            
            return this.formatProgramResponse(program);
        } catch (error) {
            throw error;
        }
    }
    
    // Delete program
    async deleteProgram(programId) {
        try {
            const result = await GoalBaseProgram.findByIdAndDelete(programId);
            
            if (!result) {
                throw new Error('GoalBase program not found');
            }
            
            return { success: true };
        } catch (error) {
            throw error;
        }
    }
    
    // Get program statistics
    async getProgramStats(programId) {
        try {
            const program = await GoalBaseProgram.findById(programId);
            
            if (!program) {
                throw new Error('GoalBase program not found');
            }
            
            return {
                completion: program.metadata.completionPercentage,
                isComplete: program.metadata.profileComplete,
                filledFields: program.metadata.filledFieldsCount,
                missingFields: program.metadata.missingFields,
                createdAt: program.metadata.createdAt,
                updatedAt: program.metadata.updatedAt
            };
        } catch (error) {
            throw error;
        }
    }
    
    // Format program response
    formatProgramResponse(program) {
        return {
            id: program._id,
            // Main fields
            selectedWorkout: program.selectedWorkout,
            currentBodyType: program.currentBodyType,
            goalBodyType: program.goalBodyType,
            targetAreas: program.targetAreas,
            healthSatisfactionStatus: program.healthSatisfactionStatus,
            fitnessExperience: program.fitnessExperience,
            workoutHistory: program.workoutHistory,
            fitnessLevel: program.fitnessLevel,
            pushupsCapability: program.pushupsCapability,
            sedentaryLifestyle: program.sedentaryLifestyle,
            walkingDuration: program.walkingDuration,
            sleepDuration: program.sleepDuration,
            waterIntake: program.waterIntake,
            mealFeelings: program.mealFeelings,
            dietaryType: program.dietaryType,
            organizationLevel: program.organizationLevel,
            habits: program.habits,
            equipmentAvailability: program.equipmentAvailability,
            // Optional fields
            exerciseMotivations: program.exerciseMotivations,
            workoutDaysPerWeek: program.workoutDaysPerWeek,
            workoutDurationMinutes: program.workoutDurationMinutes,
            primaryGoal: program.primaryGoal,
            healthConditions: program.healthConditions,
            injuries: program.injuries,
            dietaryPreference: program.dietaryPreference,
            hasGymAccess: program.hasGymAccess,
            availableEquipment: program.availableEquipment,
            // Metadata
            metadata: program.metadata,
            createdAt: program.createdAt,
            updatedAt: program.updatedAt
        };
    }
}

module.exports = new GoalBaseProgramService();