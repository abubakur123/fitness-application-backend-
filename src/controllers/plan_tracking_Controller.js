const dayProgressService = require('../services/plan_tracking_service');

class DayProgressController {

  /**
   * Get progress for a specific day
   * GET /api/progress/day/:day
   */
  async getDayProgress(req, res) {
    try {
      // Get userId from JWT token (provided by auth middleware)
      const userId = req.user.userId;
      const { day } = req.params;

      const dayNum = parseInt(day);
      if (isNaN(dayNum) || dayNum < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid day number. Must be a positive integer'
        });
      }

      const progress = await dayProgressService.getDayProgress(userId, dayNum);

      res.status(200).json({
        success: true,
        data: progress
      });

    } catch (error) {
      console.error('Controller Error - getDayProgress:', error);
      
      if (error.message === 'User has no fitness plan' || 
          error.message === 'Fitness plan not found' ||
          error.message.includes('not found in fitness plan')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch day progress',
        error: error.message
      });
    }
  }

  /**
   * Get progress for a range of days
   * GET /api/progress/range?startDay=1&endDay=7
   */
  async getProgressRange(req, res) {
    try {
      // Get userId from JWT token
      const userId = req.user.userId;
      const { startDay, endDay } = req.query;

      if (!startDay || !endDay) {
        return res.status(400).json({
          success: false,
          message: 'startDay and endDay query parameters are required'
        });
      }

      const start = parseInt(startDay);
      const end = parseInt(endDay);

      if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
        return res.status(400).json({
          success: false,
          message: 'Invalid day range. startDay and endDay must be positive integers, and startDay must be <= endDay'
        });
      }

      const progressList = await dayProgressService.getProgressRange(userId, start, end);

      res.status(200).json({
        success: true,
        count: progressList.length,
        data: progressList
      });

    } catch (error) {
      console.error('Controller Error - getProgressRange:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress range',
        error: error.message
      });
    }
  }

  /**
   * Get weekly progress summary
   * GET /api/progress/week/:weekNumber
   */
  async getWeeklyProgress(req, res) {
    try {
      // Get userId from JWT token
      const userId = req.user.userId;
      const { weekNumber } = req.params;

      const week = parseInt(weekNumber);
      if (isNaN(week) || week < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid week number. Must be a positive integer'
        });
      }

      const summary = await dayProgressService.getWeeklyProgress(userId, week);

      res.status(200).json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Controller Error - getWeeklyProgress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weekly progress',
        error: error.message
      });
    }
  }

  /**
   * Get overall program progress
   * GET /api/progress/overall
   */
  async getOverallProgress(req, res) {
    try {
      // Get userId from JWT token
      const userId = req.user.userId;

      const summary = await dayProgressService.getOverallProgress(userId);

      res.status(200).json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Controller Error - getOverallProgress:', error);
      
      if (error.message === 'User has no fitness plan' || 
          error.message === 'Fitness plan not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch overall progress',
        error: error.message
      });
    }
  }

  /**
   * Refresh/Update day progress (call this after logging exercise or nutrition)
   * POST /api/progress/refresh
   */
  async refreshDayProgress(req, res) {
    try {
      // Get userId from JWT token
      const userId = req.user.userId;
      const { day } = req.body;

      if (!day) {
        return res.status(400).json({
          success: false,
          message: 'day is required'
        });
      }

      const dayNum = parseInt(day);
      if (isNaN(dayNum) || dayNum < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid day number. Must be a positive integer'
        });
      }

      const result = await dayProgressService.refreshDayProgress(userId, dayNum);

      res.status(200).json(result);

    } catch (error) {
      console.error('Controller Error - refreshDayProgress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh day progress',
        error: error.message
      });
    }
  }

  /**
   * Delete day progress (for cleanup/testing)
   * DELETE /api/progress/day/:day
   */
  async deleteDayProgress(req, res) {
    try {
      // Get userId from JWT token
      const userId = req.user.userId;
      const { day } = req.params;

      const dayNum = parseInt(day);
      if (isNaN(dayNum) || dayNum < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid day number. Must be a positive integer'
        });
      }

      const result = await dayProgressService.deleteDayProgress(userId, dayNum);

      res.status(200).json(result);

    } catch (error) {
      console.error('Controller Error - deleteDayProgress:', error);
      
      if (error.message === 'Day progress not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete day progress',
        error: error.message
      });
    }
  }

  /**
   * Get current day progress (automatically determines the latest day)
   * GET /api/progress/current
   */
  async getCurrentDayProgress(req, res) {
    try {
      // Get userId from JWT token
      const userId = req.user.userId;

      // Get overall progress to find current day
      const overall = await dayProgressService.getOverallProgress(userId);
      const currentDay = overall.progress.currentDay || 1;

      const progress = await dayProgressService.getDayProgress(userId, currentDay);

      res.status(200).json({
        success: true,
        currentDay,
        data: progress
      });

    } catch (error) {
      console.error('Controller Error - getCurrentDayProgress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch current day progress',
        error: error.message
      });
    }
  }
}

module.exports = new DayProgressController();