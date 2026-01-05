const mongoose = require('mongoose');
const DayProgress = require('../models/plan_tracking_model');
const FitnessPlan = require('../models/fitness_plan_model');
const ExerciseLog = require('../models/excercize_tracking_model');
const Nutrition = require('../models/nutrition_model');
const User = require('../models/auth.model');

class DayProgressService {

  /**
   * Get or create day progress for a specific day
   * Uses userId from JWT token (no need to pass it)
   */
  async getDayProgress(userId, day) {
    try {
      const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
        ? new mongoose.Types.ObjectId(userId)
        : userId;

      // Get user's fitness plan
      const user = await User.findById(userObjectId);
      if (!user || !user.fitnessPlanId) {
        throw new Error('User has no fitness plan');
      }

      const fitnessPlan = await FitnessPlan.findById(user.fitnessPlanId);
      if (!fitnessPlan) {
        throw new Error('Fitness plan not found');
      }

      // Find the specific day in the plan
      const dayPlan = fitnessPlan.plan.days.find(d => d.day === day);
      if (!dayPlan) {
        throw new Error(`Day ${day} not found in fitness plan`);
      }

      // Get or create day progress
      let dayProgress = await DayProgress.findOne({ 
        userId: userObjectId, 
        day 
      });

      if (!dayProgress) {
        dayProgress = await this.createDayProgress(userObjectId, fitnessPlan, dayPlan, day);
      } else {
        // Update with latest logs
        dayProgress = await this.updateDayProgress(dayProgress, dayPlan);
      }

      return dayProgress;

    } catch (error) {
      console.error('Get Day Progress Error:', error);
      throw error;
    }
  }

  /**
   * Create initial day progress from fitness plan
   * No profileId needed - only userId from token
   */
  async createDayProgress(userId, fitnessPlan, dayPlan, day) {
    try {
      const dayProgress = new DayProgress({
        userId,
        fitnessPlanId: fitnessPlan._id,
        day,
        date: new Date(),
        dayType: dayPlan.type
      });

      // Initialize exercise progress
      if (dayPlan.type === 'workout' && dayPlan.workout && dayPlan.workout.exercises) {
        dayProgress.exerciseProgress.totalExercises = dayPlan.workout.exercises.length;
        dayProgress.exerciseProgress.pendingExercises = dayPlan.workout.exercises.length;
        
        dayProgress.exerciseProgress.exercises = dayPlan.workout.exercises.map((exercise, index) => ({
          exerciseNumber: index + 1,
          exerciseName: exercise.name,
          targetSetsReps: exercise.setsReps,
          status: 'pending'
        }));
      }

      // Initialize nutrition progress
      if (dayPlan.nutrition) {
        const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
        dayProgress.nutritionProgress.totalMeals = 4; // Explicitly set total meals
        dayProgress.nutritionProgress.targetCalories = dayPlan.nutrition.totalCalories || 0;
        dayProgress.nutritionProgress.pendingMeals = 4;

        meals.forEach(mealType => {
          if (dayPlan.nutrition[mealType]) {
            dayProgress.nutritionProgress.meals[mealType] = {
              targetDescription: dayPlan.nutrition[mealType].description,
              targetCalories: dayPlan.nutrition[mealType].calories || 0,
              status: 'pending'
            };
          }
        });
      }

      dayProgress.calculateProgress();
      await dayProgress.save();

      return dayProgress;

    } catch (error) {
      console.error('Create Day Progress Error:', error);
      throw error;
    }
  }

  /**
   * Update day progress with latest exercise and nutrition logs
   */
  async updateDayProgress(dayProgress, dayPlan) {
    try {
      // Update exercise progress
      if (dayProgress.dayType === 'workout') {
        const exerciseLogs = await ExerciseLog.find({
          userId: dayProgress.userId,
          dayNumber: dayProgress.day
        });

        let completed = 0;
        let skipped = 0;

        dayProgress.exerciseProgress.exercises.forEach(exercise => {
          const log = exerciseLogs.find(l => 
            l.exerciseNumber === exercise.exerciseNumber
          );

          if (log) {
            exercise.status = log.status;
            exercise.logId = log._id;
            
            if (log.status === 'completed') {
              exercise.actualSets = log.actualSets;
              exercise.actualReps = log.actualReps;
              completed++;
            } else if (log.status === 'skipped') {
              exercise.skipReason = log.skipReason;
              skipped++;
            }
          } else {
            exercise.status = 'pending';
          }
        });

        dayProgress.exerciseProgress.completedExercises = completed;
        dayProgress.exerciseProgress.skippedExercises = skipped;
        dayProgress.exerciseProgress.pendingExercises = 
          dayProgress.exerciseProgress.totalExercises - completed - skipped;
      }

      // Update nutrition progress
      const nutritionLog = await Nutrition.findOne({
        userId: dayProgress.userId,
        day: dayProgress.day
      });

      if (nutritionLog) {
        const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
        let completedMeals = 0;
        let skippedMeals = 0;
        let consumedCalories = 0;

        meals.forEach(mealType => {
          const meal = nutritionLog.meals[mealType];
          if (meal) {
            dayProgress.nutritionProgress.meals[mealType].status = meal.status;
            dayProgress.nutritionProgress.meals[mealType].actualDescription = meal.description;
            dayProgress.nutritionProgress.meals[mealType].actualCalories = meal.calories;
            dayProgress.nutritionProgress.meals[mealType].skipReason = meal.skipReason;
            dayProgress.nutritionProgress.meals[mealType].completedAt = meal.completedAt;

            if (meal.status === 'completed') {
              completedMeals++;
              consumedCalories += meal.calories || 0;
            } else if (meal.status === 'skipped') {
              skippedMeals++;
            }
          }
        });

        dayProgress.nutritionProgress.completedMeals = completedMeals;
        dayProgress.nutritionProgress.skippedMeals = skippedMeals;
        dayProgress.nutritionProgress.pendingMeals = 4 - completedMeals - skippedMeals;
        dayProgress.nutritionProgress.consumedCalories = consumedCalories;
      }

      dayProgress.calculateProgress();
      await dayProgress.save();

      return dayProgress;

    } catch (error) {
      console.error('Update Day Progress Error:', error);
      throw error;
    }
  }

  /**
   * Get progress for multiple days
   */
  async getProgressRange(userId, startDay, endDay) {
    try {
      const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
        ? new mongoose.Types.ObjectId(userId)
        : userId;

      const progressList = [];

      for (let day = startDay; day <= endDay; day++) {
        try {
          const progress = await this.getDayProgress(userObjectId, day);
          progressList.push(progress);
        } catch (error) {
          console.error(`Error getting progress for day ${day}:`, error.message);
          // Continue with other days even if one fails
        }
      }

      return progressList;

    } catch (error) {
      console.error('Get Progress Range Error:', error);
      throw error;
    }
  }

  /**
   * Get weekly progress summary
   */
  async getWeeklyProgress(userId, weekNumber) {
    try {
      const startDay = (weekNumber - 1) * 7 + 1;
      const endDay = weekNumber * 7;

      const progressList = await this.getProgressRange(userId, startDay, endDay);

      const summary = {
        weekNumber,
        startDay,
        endDay,
        totalDays: progressList.length,
        completedDays: progressList.filter(p => p.overallProgress.isDayComplete).length,
        workoutDays: progressList.filter(p => p.dayType === 'workout').length,
        restDays: progressList.filter(p => p.dayType === 'rest').length,
        averageCompletion: 0,
        exerciseStats: {
          total: 0,
          completed: 0,
          skipped: 0,
          pending: 0,
          done: 0, // New: completed + skipped
          completionRate: 0
        },
        nutritionStats: {
          totalMeals: 0,
          completedMeals: 0,
          skippedMeals: 0,
          pendingMeals: 0,
          doneMeals: 0, // New: completed + skipped
          completionRate: 0,
          totalTargetCalories: 0,
          totalConsumedCalories: 0,
          calorieCompletionRate: 0
        },
        days: progressList
      };

      // Calculate statistics
      progressList.forEach(day => {
        summary.exerciseStats.total += day.exerciseProgress.totalExercises;
        summary.exerciseStats.completed += day.exerciseProgress.completedExercises;
        summary.exerciseStats.skipped += day.exerciseProgress.skippedExercises;
        summary.exerciseStats.pending += day.exerciseProgress.pendingExercises;
        summary.exerciseStats.done += day.exerciseProgress.completedExercises + 
                                      day.exerciseProgress.skippedExercises;

        summary.nutritionStats.totalMeals += day.nutritionProgress.totalMeals;
        summary.nutritionStats.completedMeals += day.nutritionProgress.completedMeals;
        summary.nutritionStats.skippedMeals += day.nutritionProgress.skippedMeals;
        summary.nutritionStats.pendingMeals += day.nutritionProgress.pendingMeals;
        summary.nutritionStats.doneMeals += day.nutritionProgress.completedMeals + 
                                           day.nutritionProgress.skippedMeals;
        summary.nutritionStats.totalTargetCalories += day.nutritionProgress.targetCalories;
        summary.nutritionStats.totalConsumedCalories += day.nutritionProgress.consumedCalories;
      });

      // Calculate rates - NOW USING done (completed + skipped) instead of just completed
      summary.averageCompletion = progressList.length > 0
        ? Math.round(progressList.reduce((sum, d) => sum + d.overallProgress.completionPercentage, 0) / progressList.length)
        : 0;

      summary.exerciseStats.completionRate = summary.exerciseStats.total > 0
        ? Math.round((summary.exerciseStats.done / summary.exerciseStats.total) * 100)
        : 0;

      summary.nutritionStats.completionRate = summary.nutritionStats.totalMeals > 0
        ? Math.round((summary.nutritionStats.doneMeals / summary.nutritionStats.totalMeals) * 100)
        : 0;

      summary.nutritionStats.calorieCompletionRate = summary.nutritionStats.totalTargetCalories > 0
        ? Math.round((summary.nutritionStats.totalConsumedCalories / summary.nutritionStats.totalTargetCalories) * 100)
        : 0;

      return summary;

    } catch (error) {
      console.error('Get Weekly Progress Error:', error);
      throw error;
    }
  }

  /**
   * Get overall program progress
   */
  async getOverallProgress(userId) {
    try {
      const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
        ? new mongoose.Types.ObjectId(userId)
        : userId;

      const user = await User.findById(userObjectId);
      if (!user || !user.fitnessPlanId) {
        throw new Error('User has no fitness plan');
      }

      const fitnessPlan = await FitnessPlan.findById(user.fitnessPlanId);
      if (!fitnessPlan) {
        throw new Error('Fitness plan not found');
      }

      const totalDays = fitnessPlan.plan.overview.totalDays;
      const allProgress = await DayProgress.find({ userId: userObjectId })
        .sort({ day: 1 });

      const summary = {
        programInfo: {
          totalDays,
          activeDays: fitnessPlan.plan.overview.activeDays,
          restDays: fitnessPlan.plan.overview.restDays
        },
        progress: {
          daysTracked: allProgress.length,
          daysCompleted: allProgress.filter(p => p.overallProgress.isDayComplete).length,
          currentDay: allProgress.length > 0 ? Math.max(...allProgress.map(p => p.day)) : 0,
          overallCompletionPercentage: 0
        },
        exercises: {
          totalAssigned: 0,
          completed: 0,
          skipped: 0,
          pending: 0,
          done: 0, // New: completed + skipped
          completionRate: 0
        },
        nutrition: {
          totalMeals: 0,
          completed: 0,
          skipped: 0,
          pending: 0,
          done: 0, // New: completed + skipped
          completionRate: 0,
          totalTargetCalories: 0,
          totalConsumedCalories: 0,
          avgDailyCalories: 0
        },
        recentDays: allProgress.slice(-7) // Last 7 days
      };

      // Calculate totals
      allProgress.forEach(day => {
        summary.exercises.totalAssigned += day.exerciseProgress.totalExercises;
        summary.exercises.completed += day.exerciseProgress.completedExercises;
        summary.exercises.skipped += day.exerciseProgress.skippedExercises;
        summary.exercises.pending += day.exerciseProgress.pendingExercises;
        summary.exercises.done += day.exerciseProgress.completedExercises + 
                                 day.exerciseProgress.skippedExercises;

        summary.nutrition.totalMeals += day.nutritionProgress.totalMeals;
        summary.nutrition.completed += day.nutritionProgress.completedMeals;
        summary.nutrition.skipped += day.nutritionProgress.skippedMeals;
        summary.nutrition.pending += day.nutritionProgress.pendingMeals;
        summary.nutrition.done += day.nutritionProgress.completedMeals + 
                                 day.nutritionProgress.skippedMeals;
        summary.nutrition.totalTargetCalories += day.nutritionProgress.targetCalories;
        summary.nutrition.totalConsumedCalories += day.nutritionProgress.consumedCalories;
      });

      // Calculate rates - NOW USING done (completed + skipped) instead of just completed
      summary.progress.overallCompletionPercentage = totalDays > 0
        ? Math.round((summary.progress.daysCompleted / totalDays) * 100)
        : 0;

      summary.exercises.completionRate = summary.exercises.totalAssigned > 0
        ? Math.round((summary.exercises.done / summary.exercises.totalAssigned) * 100)
        : 0;

      summary.nutrition.completionRate = summary.nutrition.totalMeals > 0
        ? Math.round((summary.nutrition.done / summary.nutrition.totalMeals) * 100)
        : 0;

      summary.nutrition.avgDailyCalories = allProgress.length > 0
        ? Math.round(summary.nutrition.totalConsumedCalories / allProgress.length)
        : 0;

      return summary;

    } catch (error) {
      console.error('Get Overall Progress Error:', error);
      throw error;
    }
  }

  /**
   * Force refresh day progress (useful after logging exercises/nutrition)
   */
  async refreshDayProgress(userId, day) {
    try {
      const dayProgress = await this.getDayProgress(userId, day);
      return {
        success: true,
        message: 'Day progress refreshed successfully',
        data: dayProgress
      };
    } catch (error) {
      console.error('Refresh Day Progress Error:', error);
      throw error;
    }
  }

  /**
   * Delete day progress (for testing/cleanup)
   */
  async deleteDayProgress(userId, day) {
    try {
      const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
        ? new mongoose.Types.ObjectId(userId)
        : userId;

      const result = await DayProgress.findOneAndDelete({
        userId: userObjectId,
        day
      });

      if (!result) {
        throw new Error('Day progress not found');
      }

      return {
        success: true,
        message: 'Day progress deleted successfully'
      };
    } catch (error) {
      console.error('Delete Day Progress Error:', error);
      throw error;
    }
  }
}

module.exports = new DayProgressService();