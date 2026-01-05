const exerciseLogService = require('../services/excercize_tracking_services');

class ExerciseLogController {
  // Create exercise log
  async createLog(req, res) {
    try {
      const {
        dayNumber,
        exerciseNumber,
        date,
        exerciseName,
        targetSetsReps,
        status,
        actualSets,
        actualReps,
        skipReason
      } = req.body;

      // Validation
      if (!dayNumber || !exerciseNumber || !exerciseName || !targetSetsReps || !status) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: dayNumber, exerciseNumber, exerciseName, targetSetsReps, status'
        });
      }

      if (!['completed', 'skipped'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be either "completed" or "skipped"'
        });
      }

      if (status === 'completed' && (!actualSets || !actualReps)) {
        return res.status(400).json({
          success: false,
          message: 'actualSets and actualReps are required for completed exercises'
        });
      }

      const logData = {
        userId: req.user.userId || req.user._id,
        dayNumber,
        exerciseNumber,
        date: date || new Date(),
        exerciseName,
        targetSetsReps,
        status,
        actualSets: status === 'completed' ? actualSets : undefined,
        actualReps: status === 'completed' ? actualReps : undefined,
        skipReason: status === 'skipped' ? (skipReason || '') : undefined
      };

      const exerciseLog = await exerciseLogService.createLog(logData);

      res.status(201).json({
        success: true,
        message: 'Exercise log created successfully',
        data: exerciseLog
      });
    } catch (error) {
      console.error('Create log error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create exercise log',
        error: error.message
      });
    }
  }

  // Get exercise by day and exercise number
  async getByDayAndExercise(req, res) {
    try {
      const { dayNumber, exerciseNumber, date } = req.query;

      // Check if parameters exist (even if they're "0")
      if (dayNumber === undefined || exerciseNumber === undefined) {
        return res.status(400).json({
          success: false,
          message: 'dayNumber and exerciseNumber are required'
        });
      }

      const userId = req.user.userId || req.user._id;
      const logs = await exerciseLogService.getByDayAndExercise(
        userId,
        dayNumber,
        exerciseNumber,
        date
      );

      // If no logs found, return a helpful message
      if (logs.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No exercise logs found for Day ${dayNumber}, Exercise ${exerciseNumber}`,
          data: []
        });
      }

      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs
      });
    } catch (error) {
      console.error('Get by day/exercise error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exercise logs',
        error: error.message
      });
    }
  }

  // Get all logs with filters
  async getAllLogs(req, res) {
    try {
      const { startDate, endDate, status, dayNumber } = req.query;
      const userId = req.user.userId || req.user._id;

      const filters = {
        startDate,
        endDate,
        status,
        dayNumber
      };

      const logs = await exerciseLogService.getAllLogs(userId, filters);

      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs
      });
    } catch (error) {
      console.error('Get all logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exercise logs',
        error: error.message
      });
    }
  }

  // Update exercise log
  async updateLog(req, res) {
    try {
      const { logId } = req.params;
      const updates = req.body;
      const userId = req.user.userId || req.user._id;

      // Validate status change
      if (updates.status === 'completed' && (!updates.actualSets || !updates.actualReps)) {
        return res.status(400).json({
          success: false,
          message: 'actualSets and actualReps are required for completed exercises'
        });
      }

      const log = await exerciseLogService.updateLog(logId, userId, updates);

      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Exercise log not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Exercise log updated successfully',
        data: log
      });
    } catch (error) {
      console.error('Update log error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update exercise log',
        error: error.message
      });
    }
  }

  // Delete exercise log
  async deleteLog(req, res) {
    try {
      const { logId } = req.params;
      const userId = req.user.userId || req.user._id;

      const log = await exerciseLogService.deleteLog(logId, userId);

      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Exercise log not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Exercise log deleted successfully'
      });
    } catch (error) {
      console.error('Delete log error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete exercise log',
        error: error.message
      });
    }
  }
}

module.exports = new ExerciseLogController();