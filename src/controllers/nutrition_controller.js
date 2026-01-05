const nutritionService = require('../services/nutrition_service');

class NutritionController {

  // Update single meal
  async updateSingleMeal(req, res) {
    try {
      const userId = req.user.userId;
      const { day, date, mealType, description, calories, status, skipReason, totalCalories } = req.body;
      
      // Validate required fields
      if (!day || !date || !mealType) {
        return res.status(400).json({
          success: false,
          message: 'Day, date, and mealType are required'
        });
      }

      // Validate mealType
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      if (!validMealTypes.includes(mealType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid mealType. Must be one of: breakfast, lunch, dinner, snack'
        });
      }

      const nutrition = await nutritionService.updateSingleMeal(
        userId, 
        day,
        date,
        mealType,
        { description, calories, status, skipReason, totalCalories }
      );
      
      res.status(200).json({
        success: true,
        message: `${mealType} updated successfully`,
        data: nutrition
      });
    } catch (error) {
      console.error('Error in updateSingleMeal:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Create/Update nutrition entry
  async createOrUpdateNutrition(req, res) {
    try {
      const userId = req.user.userId;
      const nutritionData = req.body;
      
      // Validate required fields
      if (!nutritionData.day || !nutritionData.date) {
        return res.status(400).json({
          success: false,
          message: 'Day and date are required'
        });
      }

      const nutrition = await nutritionService.createOrUpdateNutrition(userId, nutritionData);
      
      res.status(200).json({
        success: true,
        message: 'Nutrition data saved successfully',
        data: nutrition
      });
    } catch (error) {
      console.error('Error in createOrUpdateNutrition:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Update meal status
  async updateMealStatus(req, res) {
    try {
      const userId = req.user.userId;
      const { day, mealType, status, skipReason } = req.body;
      
      // Validate required fields
      if (!day || !mealType || !status) {
        return res.status(400).json({
          success: false,
          message: 'Day, mealType, and status are required'
        });
      }

      // Validate mealType
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      if (!validMealTypes.includes(mealType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid mealType. Must be one of: breakfast, lunch, dinner, snack'
        });
      }

      // Validate status
      const validStatuses = ['pending', 'completed', 'skipped'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, completed, skipped'
        });
      }

      const nutrition = await nutritionService.updateMealStatus(
        userId,
        day, 
        mealType, 
        status, 
        skipReason
      );
      
      res.status(200).json({
        success: true,
        message: 'Meal status updated successfully',
        data: nutrition
      });
    } catch (error) {
      console.error('Error in updateMealStatus:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get nutrition by period
  async getNutritionByPeriod(req, res) {
    try {
      const userId = req.user.userId;
      const { period } = req.params;
      
      let nutritionData;
      
      switch (period) {
        case 'today':
          nutritionData = await nutritionService.getTodayNutrition(userId);
          break;
        case 'week':
          nutritionData = await nutritionService.getLast7DaysNutrition(userId);
          break;
        case 'month':
          nutritionData = await nutritionService.getLast30DaysNutrition(userId);
          break;
        case '6months':
          nutritionData = await nutritionService.getLast6MonthsNutrition(userId);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid period. Use: today, week, month, 6months'
          });
      }
      
      res.status(200).json({
        success: true,
        data: nutritionData || []
      });
    } catch (error) {
      console.error('Error in getNutritionByPeriod:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get specific day nutrition
  async getDayNutrition(req, res) {
    try {
      const userId = req.user.userId;
      const { day } = req.params;
      
      const dayNum = parseInt(day);
      if (isNaN(dayNum)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid day parameter'
        });
      }
      
      const nutrition = await nutritionService.getNutritionByDay(userId, dayNum);
      
      if (!nutrition) {
        return res.status(404).json({
          success: false,
          message: 'Nutrition data not found for this day',
          data: null
        });
      }
      
      res.status(200).json({
        success: true,
        data: nutrition
      });
    } catch (error) {
      console.error('Error in getDayNutrition:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get nutrition by date range
  async getNutritionByRange(req, res) {
    try {
      const userId = req.user.userId;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate query parameters are required'
        });
      }
      
      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use ISO format (YYYY-MM-DD)'
        });
      }
      
      if (start > end) {
        return res.status(400).json({
          success: false,
          message: 'startDate must be before endDate'
        });
      }
      
      const nutritionData = await nutritionService.getNutritionByDateRange(
        userId, 
        startDate, 
        endDate
      );
      
      res.status(200).json({
        success: true,
        data: nutritionData
      });
    } catch (error) {
      console.error('Error in getNutritionByRange:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
}

module.exports = new NutritionController();