const OpenAI = require('openai');
const FitnessPlan = require('../models/fitness_plan_model');
const Profile = require('../models/profile_model');
const User = require('../models/auth.model');
const FitnessPlanPromptBuilder = require('./fitness_plan_prompt_builder');

const openai = new OpenAI({
  apiKey: process.env.CHAT_GPT_API
});

class FitnessPlanService {
  constructor() {
    this.promptBuilder = FitnessPlanPromptBuilder;
  }

  /* =========================
     PUBLIC METHODS
  ========================== */

  async generateFitnessPlan(profileId) {
    try {
      const profile = await Profile.findById(profileId)
        .populate('adaptiveProfile')
        .populate('goalBasedProgram');

      if (!profile) throw new Error('Profile not found');

      // First, check if a plan already exists for this profile
      const existingPlan = await FitnessPlan.findOne({ profileId })
        .sort({ generatedAt: -1 });
      
      // Optional: Delete old plan before creating new one
      if (existingPlan) {
        console.log(`Deleting existing plan ${existingPlan._id} before creating new one`);
        await FitnessPlan.findByIdAndDelete(existingPlan._id);
      }

      const { planType, programData, prompt } = this.promptBuilder.buildPrompt(profile);

      if (!planType) {
        throw new Error('No program (adaptive or goal-based) found');
      }

      const generatedPlan = await this._callChatGPT(prompt);

      const fitnessPlan = await this._savePlan(
        profileId,
        generatedPlan,
        planType,
        profile,
        programData
      );

      // Find ALL users with this profileId and update them
      await User.updateMany(
        { profileId },
        { fitnessPlanId: fitnessPlan._id }
      );

      return {
        success: true,
        planId: fitnessPlan._id,
        message: existingPlan ? 
          'Fitness plan regenerated successfully (old plan deleted)' : 
          'Fitness plan generated successfully'
      };

    } catch (error) {
      console.error('FitnessPlanService Error:', error);
      throw error;
    }
  }

  async getFitnessPlan(profileId) {
    // Get plan data along with program info from snapshot
    return FitnessPlan.findOne({ profileId })
      .select('plan planType generatedAt programSnapshot')
      .sort({ generatedAt: -1 })
      .then(plan => {
        if (!plan) return null;
        return this._formatPlanResponse(plan);
      });
  }

  async getFitnessPlanById(planId) {
    // Get plan data along with program info from snapshot
    return FitnessPlan.findById(planId)
      .select('plan planType generatedAt programSnapshot')
      .then(plan => {
        if (!plan) return null;
        return this._formatPlanResponse(plan);
      });
  }

  // Helper method to format plan response with program info
  _formatPlanResponse(plan) {
    const response = {
      plan: plan.plan,
      planType: plan.planType,
      generatedAt: plan.generatedAt,
      _id: plan._id
    };

    // Add program info if available in snapshot
    if (plan.programSnapshot) {
      if (plan.planType === 'adaptive' && plan.programSnapshot._id) {
        response.program = {
          programId: plan.programSnapshot._id,
          programName: plan.programSnapshot.programName || 'Adaptive Program',
          programType: 'adaptive'
        };
      } else if (plan.planType === 'goalBased' && plan.programSnapshot._id) {
        response.program = {
          programId: plan.programSnapshot._id,
          programName: plan.programSnapshot.programName || 'Goal-Based Program',
          programType: 'goalBased',
          goalType: plan.programSnapshot.goalType || null,
          targetArea: plan.programSnapshot.targetArea || null
        };
      } else if (plan.programSnapshot._id) {
        // Fallback for any program type
        response.program = {
          programId: plan.programSnapshot._id,
          programName: plan.programSnapshot.programName || `${plan.planType} Program`,
          programType: plan.planType
        };
      }
    }

    return response;
  }

  // Get only exercises with their steps
  async getAllExercisesWithSteps() {
    try {
      // Get only plan field to reduce data transfer
      const fitnessPlans = await FitnessPlan.find()
        .select('plan')
        .sort({ generatedAt: -1 });
      
      const exercisesMap = new Map();
      
      fitnessPlans.forEach(plan => {
        if (plan.plan && plan.plan.days) {
          plan.plan.days.forEach(day => {
            if (day.type === 'workout' && day.workout && day.workout.exercises) {
              day.workout.exercises.forEach(exercise => {
                if (exercise.name && exercise.steps && exercise.steps.length > 0) {
                  const exerciseKey = exercise.name;
                  
                  if (!exercisesMap.has(exerciseKey)) {
                    exercisesMap.set(exerciseKey, {
                      name: exercise.name,
                      steps: new Map() // Store unique step variations
                    });
                  }
                  
                  const exerciseData = exercisesMap.get(exerciseKey);
                  const stepsKey = JSON.stringify(exercise.steps);
                  exerciseData.steps.set(stepsKey, exercise.steps);
                }
              });
            }
          });
        }
      });
      
      // Convert to array format
      const exercises = Array.from(exercisesMap.values()).map(e => ({
        name: e.name,
        steps: Array.from(e.steps.values()) // Get all unique step variations
      })).sort((a, b) => a.name.localeCompare(b.name));
      
      return {
        exercises,
        totalExercises: exercises.length
      };
      
    } catch (error) {
      console.error('Get All Exercises With Steps Error:', error);
      throw error;
    }
  }

  async getAllWorkoutNames() {
    try {
      // Get only plan field to reduce data transfer
      const fitnessPlans = await FitnessPlan.find()
        .select('plan')
        .sort({ generatedAt: -1 });
      
      const workoutNames = new Set();
      const exerciseNames = new Set();
      
      fitnessPlans.forEach(plan => {
        if (plan.plan && plan.plan.days) {
          plan.plan.days.forEach(day => {
            if (day.type === 'workout' && day.workout) {
              // Collect workout focus
              if (day.workout.focus) {
                workoutNames.add(day.workout.focus);
              }
              
              // Collect exercise names
              if (day.workout.exercises && Array.isArray(day.workout.exercises)) {
                day.workout.exercises.forEach(exercise => {
                  if (exercise.name) {
                    exerciseNames.add(exercise.name);
                  }
                });
              }
            }
          });
        }
      });
      
      return {
        workoutFocuses: Array.from(workoutNames).sort(),
        exercises: Array.from(exerciseNames).sort(),
        totalWorkoutTypes: workoutNames.size,
        totalExercises: exerciseNames.size
      };
      
    } catch (error) {
      console.error('Get All Workout Names Error:', error);
      throw error;
    }
  }

  // Alternative: Get detailed workout and exercise information with steps
  async getAllWorkoutsDetailed() {
    try {
      // Get only plan field to reduce data transfer
      const fitnessPlans = await FitnessPlan.find()
        .select('plan')
        .sort({ generatedAt: -1 });
      
      const workoutsMap = new Map();
      const exercisesMap = new Map();
      
      fitnessPlans.forEach(plan => {
        if (plan.plan && plan.plan.days) {
          plan.plan.days.forEach(day => {
            if (day.type === 'workout' && day.workout) {
              // Store workout details
              if (day.workout.focus) {
                const focusKey = day.workout.focus;
                if (!workoutsMap.has(focusKey)) {
                  workoutsMap.set(focusKey, {
                    name: day.workout.focus,
                    intensities: new Set(),
                    occurrences: 0
                  });
                }
                const workoutData = workoutsMap.get(focusKey);
                if (day.workout.intensity) {
                  workoutData.intensities.add(day.workout.intensity);
                }
                workoutData.occurrences++;
              }
              
              // Store exercise details with steps and tips
              if (day.workout.exercises && Array.isArray(day.workout.exercises)) {
                day.workout.exercises.forEach(exercise => {
                  if (exercise.name) {
                    const exerciseKey = exercise.name;
                    if (!exercisesMap.has(exerciseKey)) {
                      exercisesMap.set(exerciseKey, {
                        name: exercise.name,
                        descriptions: new Set(),
                        steps: new Map(), // Store unique step arrays
                        setsReps: new Set(),
                        tips: new Set(),
                        occurrences: 0
                      });
                    }
                    const exerciseData = exercisesMap.get(exerciseKey);
                    
                    if (exercise.description) {
                      exerciseData.descriptions.add(exercise.description);
                    }
                    
                    // Store steps (compare as JSON string to avoid duplicates)
                    if (exercise.steps && Array.isArray(exercise.steps) && exercise.steps.length > 0) {
                      const stepsKey = JSON.stringify(exercise.steps);
                      exerciseData.steps.set(stepsKey, exercise.steps);
                    }
                    
                    if (exercise.setsReps) {
                      exerciseData.setsReps.add(exercise.setsReps);
                    }
                    
                    // Store tips
                    if (exercise.tips && Array.isArray(exercise.tips)) {
                      exercise.tips.forEach(tip => {
                        if (tip) exerciseData.tips.add(tip);
                      });
                    }
                    
                    exerciseData.occurrences++;
                  }
                });
              }
            }
          });
        }
      });
      
      // Convert maps to arrays with proper formatting
      const workouts = Array.from(workoutsMap.values()).map(w => ({
        name: w.name,
        intensities: Array.from(w.intensities),
        occurrences: w.occurrences
      })).sort((a, b) => b.occurrences - a.occurrences);
      
      const exercises = Array.from(exercisesMap.values()).map(e => ({
        name: e.name,
        descriptions: Array.from(e.descriptions),
        steps: Array.from(e.steps.values()), // Get all unique step arrays
        setsReps: Array.from(e.setsReps),
        tips: Array.from(e.tips),
        occurrences: e.occurrences
      })).sort((a, b) => b.occurrences - a.occurrences);
      
      return {
        workouts,
        exercises,
        summary: {
          totalUniqueWorkouts: workouts.length,
          totalUniqueExercises: exercises.length,
          totalPlansAnalyzed: fitnessPlans.length
        }
      };
      
    } catch (error) {
      console.error('Get All Workouts Detailed Error:', error);
      throw error;
    }
  }

  /* =========================
    DELETE METHODS
  ========================== */

  async deleteFitnessPlan(planId) {
    try {
      const fitnessPlan = await FitnessPlan.findById(planId);
      
      if (!fitnessPlan) {
        throw new Error('Fitness plan not found');
      }

      const profileId = fitnessPlan.profileId;

      // Delete the fitness plan
      await FitnessPlan.findByIdAndDelete(planId);

      // Remove fitnessPlanId reference from User
      await User.findOneAndUpdate(
        { profileId },
        { $unset: { fitnessPlanId: "" } }
      );

      return {
        success: true,
        message: 'Fitness plan deleted successfully'
      };

    } catch (error) {
      console.error('Delete FitnessPlan Error:', error);
      throw error;
    }
  }

  /* =========================
    ADDITIONAL GET METHODS
  ========================== */

  async getAllFitnessPlans() {
    try {
      // Get plans with program info
      const fitnessPlans = await FitnessPlan.find()
        .select('plan planType generatedAt programSnapshot profileId')
        .sort({ generatedAt: -1 })
        .populate({
          path: 'profileId',
          select: 'userId age gender currentWeightKg targetWeightKg',
          populate: {
            path: 'userId',
            select: 'email firstName lastName'
          }
        });

      // Format each plan with program info
      return fitnessPlans.map(plan => {
        const formattedPlan = this._formatPlanResponse(plan);
        
        // Add profile info if available
        if (plan.profileId) {
          formattedPlan.profile = {
            profileId: plan.profileId._id,
            age: plan.profileId.age,
            gender: plan.profileId.gender,
            currentWeightKg: plan.profileId.currentWeightKg,
            targetWeightKg: plan.profileId.targetWeightKg
          };
          
          // Add user info if available
          if (plan.profileId.userId) {
            formattedPlan.user = {
              email: plan.profileId.userId.email,
              firstName: plan.profileId.userId.firstName,
              lastName: plan.profileId.userId.lastName
            };
          }
        }
        
        return formattedPlan;
      });
    } catch (error) {
      console.error('Get All Plans Error:', error);
      throw error;
    }
  }

  async getFitnessPlanByEmail(email) {
    try {
      // Find user by email
      const user = await User.findOne({ email });
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.profileId) {
        throw new Error('User has no profile');
      }

      // Get plan data along with program info
      const fitnessPlan = await FitnessPlan.findOne({ 
        profileId: user.profileId 
      })
      .select('plan planType generatedAt programSnapshot')
      .sort({ generatedAt: -1 });

      if (!fitnessPlan) {
        throw new Error('No fitness plan found for this user');
      }

      return this._formatPlanResponse(fitnessPlan);

    } catch (error) {
      console.error('Get Plan By Email Error:', error);
      throw error;
    }
  }

  /* =========================
     OPENAI
  ========================== */

  async _callChatGPT(prompt) {
    try {
      const response = await openai.responses.create({
        model: 'gpt-4o-mini',
        input: [
          {
            role: 'system',
            content: this.promptBuilder.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_output_tokens: 4000
      });

      let responseText = response.output_text.trim();
      
      // Remove markdown code blocks if present
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Parse and validate JSON
      const parsedPlan = JSON.parse(responseText);
      
      return parsedPlan;
    } catch (error) {
      console.error('ChatGPT Error:', error);
      throw new Error('Failed to generate plan');
    }
  }

  /* =========================
     DATABASE
  ========================== */

  async _savePlan(profileId, plan, planType, profile, programData) {
    const fitnessPlan = new FitnessPlan({
      profileId,
      plan, // Now this will be a structured JSON object
      planType,
      profileSnapshot: {
        gender: profile.gender,
        age: profile.age,
        heightCm: profile.heightCm,
        currentWeightKg: profile.currentWeightKg,
        targetWeightKg: profile.targetWeightKg,
        commitment: profile.commitment,
        workoutDays: profile.workoutDays
      },
      programSnapshot: programData.toObject()
    });

    await fitnessPlan.save();
    return fitnessPlan;
  }
}

module.exports = new FitnessPlanService();