const exerciseLogService = require('../services/excercize_tracking_services');
const nutritionService = require('../services/nutrition_service');

class StatsController {
  // ==================== EXERCISE STATS ====================
  
  // Get summary statistics
  async getExerciseStats(req, res) {
    try {
      const { period = '7' } = req.query;
      const days = parseInt(period);
      const userId = req.user.userId || req.user._id;

      const stats = await exerciseLogService.getSummaryStats(userId, days);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }

  // Get completion statistics
  async getExerciseCompletionStats(req, res) {
    try {
      const { period = '7' } = req.query;
      const days = parseInt(period);
      const userId = req.user.userId || req.user._id;

      const dailyStats = await exerciseLogService.getCompletionStats(userId, days);

      res.status(200).json({
        success: true,
        period: `${days} days`,
        data: dailyStats
      });
    } catch (error) {
      console.error('Get completion stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch completion statistics',
        error: error.message
      });
    }
  }

  // Get timeline statistics
  async getExerciseTimelineStats(req, res) {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period);
      const userId = req.user.userId || req.user._id;

      const timelineData = await exerciseLogService.getTimelineStats(userId, days);

      res.status(200).json({
        success: true,
        period: `${days} days`,
        data: timelineData
      });
    } catch (error) {
      console.error('Get timeline stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch timeline statistics',
        error: error.message
      });
    }
  }

  // ==================== NUTRITION STATS ====================

  // Get nutrition summary
  async getNutritionSummary(req, res) {
    try {
      const userId = req.user.userId;
      const { period } = req.params;
      
      const validPeriods = ['week', 'month', '6months'];
      if (!validPeriods.includes(period)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid period. Use: week, month, 6months'
        });
      }
      
      const summary = await nutritionService.getNutritionSummary(userId, period);
      
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error in getNutritionSummary:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get nutrition calendar
  async getNutritionCalendar(req, res) {
    try {
      const userId = req.user.userId;
      const { year, month } = req.params;
      
      // Validate year and month
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid year. Must be between 2000 and 2100'
        });
      }
      
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month. Must be between 1 and 12'
        });
      }
      
      const calendar = await nutritionService.getNutritionCalendar(
        userId, 
        yearNum, 
        monthNum
      );
      
      res.status(200).json({
        success: true,
        data: calendar
      });
    } catch (error) {
      console.error('Error in getNutritionCalendar:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // ==================== COMBINED STATS ====================

  // Get overall dashboard stats (combine exercise and nutrition)
  async getDashboardStats(req, res) {
    try {
      const userId = req.user.userId || req.user._id;
      const { period = '7' } = req.query;
      const days = parseInt(period);

      // Fetch both exercise and nutrition stats in parallel
      const [exerciseStats, nutritionSummary] = await Promise.all([
        exerciseLogService.getSummaryStats(userId, days),
        nutritionService.getNutritionSummary(userId, period === '7' ? 'week' : period === '30' ? 'month' : '6months')
      ]);

      res.status(200).json({
        success: true,
        period: `${days} days`,
        data: {
          exercise: exerciseStats,
          nutrition: nutritionSummary
        }
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message
      });
    }
  }
}

module.exports = new StatsController();