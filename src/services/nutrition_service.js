const mongoose = require('mongoose');
const Nutrition = require('../models/nutrition_model');

class NutritionService {

    // In nutrition_service.js
    async updateSingleMeal(userId, day, date, mealType, mealData) {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
        ? new mongoose.Types.ObjectId(userId)
        : userId;
    
    // Find or create nutrition entry
    let nutrition = await Nutrition.findOne({
        userId: userObjectId,
        day
    });

    if (!nutrition) {
        // Create new entry with this single meal
        nutrition = new Nutrition({
        userId: userObjectId,
        day,
        date: new Date(date),
        totalCalories: mealData.totalCalories || 0,  // ✅ Use from mealData
        meals: {
            breakfast: { status: 'pending' },
            lunch: { status: 'pending' },
            dinner: { status: 'pending' },
            snack: { status: 'pending' }
        }
        });
    } else {
        // ✅ Update totalCalories if provided
        if (mealData.totalCalories !== undefined) {
        nutrition.totalCalories = mealData.totalCalories;
        }
    }

    // Update the specific meal
    nutrition.meals[mealType] = {
        ...nutrition.meals[mealType],
        description: mealData.description,
        calories: mealData.calories || 0,
        status: mealData.status || 'pending',
        skipReason: mealData.status === 'skipped' ? mealData.skipReason : undefined,
        completedAt: mealData.status === 'completed' ? new Date() : undefined
    };

    await nutrition.save();
    return nutrition;
    }

  // Create or update nutrition entry for a day
  async createOrUpdateNutrition(userId, nutritionData) {
    const { day, date, ...otherData } = nutritionData;
    
    // Convert userId to ObjectId
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    
    // Find existing entry for this day and user
    const existingEntry = await Nutrition.findOne({
      userId: userObjectId,
      $or: [
        { day },
        { date: new Date(date) }
      ]
    });

    if (existingEntry) {
      // Update existing entry
      Object.keys(otherData).forEach(key => {
        if (otherData[key] !== undefined) {
          existingEntry[key] = otherData[key];
        }
      });
      
      // Handle meals update
      if (nutritionData.meals) {
        Object.keys(nutritionData.meals).forEach(mealType => {
          if (nutritionData.meals[mealType]) {
            existingEntry.meals[mealType] = {
              ...existingEntry.meals[mealType],
              ...nutritionData.meals[mealType]
            };
          }
        });
      }
      
      await existingEntry.save();
      return existingEntry;
    } else {
      // Create new entry
      const nutrition = new Nutrition({
        userId: userObjectId,
        day,
        date: new Date(date),
        ...otherData
      });
      
      await nutrition.save();
      return nutrition;
    }
  }

  // Get nutrition by day
  async getNutritionByDay(userId, day) {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    
    return await Nutrition.findOne({ userId: userObjectId, day });
  }

  // Get nutrition by date range
  async getNutritionByDateRange(userId, startDate, endDate) {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    
    return await Nutrition.find({
      userId: userObjectId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: 1 });
  }

  // Get last 7 days nutrition
  async getLast7DaysNutrition(userId) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // Last 7 days including today
    
    return await this.getNutritionByDateRange(userId, startDate, endDate);
  }

  // Get last 30 days nutrition
  async getLast30DaysNutrition(userId) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29); // Last 30 days including today
    
    return await this.getNutritionByDateRange(userId, startDate, endDate);
  }

  // Get last 6 months nutrition (monthly aggregation)
  async getLast6MonthsNutrition(userId) {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 5); // Last 6 months
    startDate.setDate(1); // Start from first day of the month
    
    return await Nutrition.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          totalCalories: { $avg: "$totalCalories" },
          consumedCalories: { $avg: "$consumedCalories" },
          days: { $push: "$$ROOT" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          averageTargetCalories: { $round: ["$totalCalories", 2] },
          averageConsumedCalories: { $round: ["$consumedCalories", 2] },
          daysCount: "$count",
          completionRate: {
            $cond: {
              if: { $eq: ["$totalCalories", 0] },
              then: 0,
              else: { 
                $multiply: [
                  { $divide: ["$consumedCalories", "$totalCalories"] }, 
                  100
                ] 
              }
            }
          }
        }
      }
    ]);
  }

  // Get today's nutrition
  async getTodayNutrition(userId) {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await Nutrition.findOne({
      userId: userObjectId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
  }

  // Update meal status
  async updateMealStatus(userId, day, mealType, status, skipReason = null) {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    
    const nutrition = await Nutrition.findOne({ userId: userObjectId, day });
    
    if (!nutrition) {
      throw new Error('Nutrition entry not found');
    }
    
    // Check if meal exists
    if (!nutrition.meals[mealType]) {
      throw new Error(`Meal type '${mealType}' not found`);
    }
    
    nutrition.meals[mealType].status = status;
    
    if (status === 'skipped' && skipReason) {
      nutrition.meals[mealType].skipReason = skipReason;
    }
    
    if (status === 'completed') {
      nutrition.meals[mealType].completedAt = new Date();
      nutrition.meals[mealType].skipReason = undefined;
    }
    
    await nutrition.save();
    return nutrition;
  }

  // Get nutrition summary
  async getNutritionSummary(userId, period = 'week') {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    
    const periods = {
      'week': 7,
      'month': 30,
      '6months': 180
    };
    
    const days = periods[period] || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    
    const nutritionData = await this.getNutritionByDateRange(
      userObjectId, 
      startDate.toISOString(), 
      endDate.toISOString()
    );
    
    const summary = {
      totalDays: nutritionData.length,
      totalTargetCalories: 0,
      totalConsumedCalories: 0,
      averageTargetCalories: 0,
      averageConsumedCalories: 0,
      completionRate: 0,
      mealsCompleted: 0,
      mealsSkipped: 0,
      mealsPending: 0,
      dailyData: nutritionData.map(day => ({
        date: day.date,
        day: day.day,
        totalCalories: day.totalCalories,
        consumedCalories: day.consumedCalories,
        completionPercentage: day.totalCalories > 0 
          ? (day.consumedCalories / day.totalCalories) * 100 
          : 0,
        meals: day.meals,
        isRestDay: day.isRestDay
      }))
    };
    
    // Calculate totals and averages
    nutritionData.forEach(day => {
      summary.totalTargetCalories += day.totalCalories;
      summary.totalConsumedCalories += day.consumedCalories;
      
      Object.values(day.meals).forEach(meal => {
        if (meal.status === 'completed') summary.mealsCompleted++;
        else if (meal.status === 'skipped') summary.mealsSkipped++;
        else summary.mealsPending++;
      });
    });
    
    if (nutritionData.length > 0) {
      summary.averageTargetCalories = summary.totalTargetCalories / nutritionData.length;
      summary.averageConsumedCalories = summary.totalConsumedCalories / nutritionData.length;
      summary.completionRate = summary.totalTargetCalories > 0
        ? (summary.totalConsumedCalories / summary.totalTargetCalories) * 100
        : 0;
    }
    
    // Round the numbers
    summary.averageTargetCalories = Math.round(summary.averageTargetCalories * 100) / 100;
    summary.averageConsumedCalories = Math.round(summary.averageConsumedCalories * 100) / 100;
    summary.completionRate = Math.round(summary.completionRate * 100) / 100;
    
    return summary;
  }

  // Get nutrition calendar for a month
  async getNutritionCalendar(userId, year, month) {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month
    
    const nutritionData = await this.getNutritionByDateRange(
      userObjectId, 
      startDate, 
      endDate
    );
    
    // Create calendar structure
    const calendar = [];
    const totalDays = endDate.getDate();
    
    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(year, month - 1, day);
      const nutrition = nutritionData.find(n => 
        n.date.getDate() === day && 
        n.date.getMonth() === month - 1
      );
      
      calendar.push({
        day,
        date: currentDate,
        hasData: !!nutrition,
        totalCalories: nutrition?.totalCalories || 0,
        consumedCalories: nutrition?.consumedCalories || 0,
        completionPercentage: nutrition && nutrition.totalCalories > 0 
          ? (nutrition.consumedCalories / nutrition.totalCalories) * 100 
          : 0,
        isRestDay: nutrition?.isRestDay || false,
        meals: nutrition?.meals || null
      });
    }
    
    return calendar;
  }
}

module.exports = new NutritionService();