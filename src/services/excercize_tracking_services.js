const ExerciseLog = require('../models/excercize_tracking_model');
const moment = require('moment');

class ExerciseLogService {
  // Create a new exercise log
  async createLog(logData) {
    try {
      const exerciseLog = new ExerciseLog(logData);
      await exerciseLog.save();
      return exerciseLog;
    } catch (error) {
      throw new Error(`Error creating exercise log: ${error.message}`);
    }
  }

  // Get exercise logs by day and exercise number
  async getByDayAndExercise(userId, dayNumber, exerciseNumber, date = null) {
    try {
      const query = {
        userId,
        dayNumber: parseInt(dayNumber),
        exerciseNumber: parseInt(exerciseNumber)
      };

      if (date) {
        const startOfDay = moment(date).startOf('day').toDate();
        const endOfDay = moment(date).endOf('day').toDate();
        query.date = { $gte: startOfDay, $lte: endOfDay };
      }

      const logs = await ExerciseLog.find(query).sort({ date: -1 });
      return logs;
    } catch (error) {
      throw new Error(`Error fetching exercise logs: ${error.message}`);
    }
  }

  // Get all logs with filters
  async getAllLogs(userId, filters = {}) {
    try {
      const query = { userId };

      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) query.date.$gte = new Date(filters.startDate);
        if (filters.endDate) query.date.$lte = new Date(filters.endDate);
      }

      if (filters.status) query.status = filters.status;
      if (filters.dayNumber) query.dayNumber = parseInt(filters.dayNumber);

      const logs = await ExerciseLog.find(query).sort({ date: -1 });
      return logs;
    } catch (error) {
      throw new Error(`Error fetching all logs: ${error.message}`);
    }
  }

  // Get summary statistics
  async getSummaryStats(userId, days = 7) {
    try {
      const startDate = moment().subtract(days, 'days').startOf('day').toDate();
      const endDate = moment().endOf('day').toDate();

      const logs = await ExerciseLog.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      });

      const completedCount = logs.filter(l => l.status === 'completed').length;
      const skippedCount = logs.filter(l => l.status === 'skipped').length;

      return {
        period: `${days} days`,
        totalExercises: logs.length,
        completed: completedCount,
        skipped: skippedCount,
        completionRate: logs.length > 0 
          ? ((completedCount / logs.length) * 100).toFixed(1)
          : 0,
        uniqueDays: [...new Set(logs.map(l => moment(l.date).format('YYYY-MM-DD')))].length,
        avgExercisesPerDay: logs.length > 0 
          ? (logs.length / days).toFixed(1)
          : 0,
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD')
      };
    } catch (error) {
      throw new Error(`Error fetching summary stats: ${error.message}`);
    }
  }

  // Get daily completion statistics
  async getCompletionStats(userId, days = 7) {
    try {
      const startDate = moment().subtract(days, 'days').startOf('day').toDate();
      const endDate = moment().endOf('day').toDate();

      const pipeline = [
        {
          $match: {
            userId,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              day: { $dayOfYear: '$date' },
              year: { $year: '$date' }
            },
            totalExercises: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            skipped: {
              $sum: { $cond: [{ $eq: ['$status', 'skipped'] }, 1, 0] }
            },
            date: { $first: '$date' }
          }
        },
        {
          $sort: { date: 1 }
        }
      ];

      const dailyStats = await ExerciseLog.aggregate(pipeline);

      return dailyStats.map(stat => ({
        date: moment(stat.date).format('YYYY-MM-DD'),
        totalExercises: stat.totalExercises,
        completed: stat.completed,
        skipped: stat.skipped,
        completionRate: ((stat.completed / stat.totalExercises) * 100).toFixed(1)
      }));
    } catch (error) {
      throw new Error(`Error fetching completion stats: ${error.message}`);
    }
  }

  // Get timeline and pattern statistics
  async getTimelineStats(userId, days = 30) {
    try {
      const startDate = moment().subtract(days, 'days').startOf('day').toDate();
      const endDate = moment().endOf('day').toDate();

      const logs = await ExerciseLog.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      });

      // Most completed exercises
      const exerciseFrequency = {};
      logs.forEach(log => {
        if (log.status === 'completed') {
          exerciseFrequency[log.exerciseName] = (exerciseFrequency[log.exerciseName] || 0) + 1;
        }
      });

      const topExercises = Object.entries(exerciseFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ exerciseName: name, count }));

      // Activity by day of week
      const dayOfWeekStats = {
        Monday: { total: 0, completed: 0 },
        Tuesday: { total: 0, completed: 0 },
        Wednesday: { total: 0, completed: 0 },
        Thursday: { total: 0, completed: 0 },
        Friday: { total: 0, completed: 0 },
        Saturday: { total: 0, completed: 0 },
        Sunday: { total: 0, completed: 0 }
      };

      logs.forEach(log => {
        const dayName = moment(log.date).format('dddd');
        dayOfWeekStats[dayName].total++;
        if (log.status === 'completed') {
          dayOfWeekStats[dayName].completed++;
        }
      });

      // Current streak calculation
      const uniqueDates = [...new Set(logs.map(l => moment(l.date).format('YYYY-MM-DD')))].sort().reverse();
      let currentStreak = 0;
      let checkDate = moment();

      for (let i = 0; i < uniqueDates.length; i++) {
        if (moment(uniqueDates[i]).isSame(checkDate, 'day')) {
          currentStreak++;
          checkDate = checkDate.subtract(1, 'day');
        } else {
          break;
        }
      }

      return {
        topExercises,
        dayOfWeekStats,
        totalWorkoutDays: uniqueDates.length,
        currentStreak,
        longestStreak: this._calculateLongestStreak(uniqueDates)
      };
    } catch (error) {
      throw new Error(`Error fetching timeline stats: ${error.message}`);
    }
  }

  // Helper: Calculate longest streak
  _calculateLongestStreak(sortedDates) {
    if (sortedDates.length === 0) return 0;
    
    let longest = 1;
    let current = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = moment(sortedDates[i - 1]);
      const currDate = moment(sortedDates[i]);
      
      if (prevDate.diff(currDate, 'days') === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }

    return longest;
  }

  // Update exercise log
  async updateLog(logId, userId, updates) {
    try {
      const log = await ExerciseLog.findOne({ _id: logId, userId });

      if (!log) {
        return null;
      }

      Object.assign(log, updates);
      await log.save();
      return log;
    } catch (error) {
      throw new Error(`Error updating exercise log: ${error.message}`);
    }
  }

  // Delete exercise log
  async deleteLog(logId, userId) {
    try {
      const log = await ExerciseLog.findOneAndDelete({ _id: logId, userId });
      return log;
    } catch (error) {
      throw new Error(`Error deleting exercise log: ${error.message}`);
    }
  }

  // Get exercise log by ID
  async getLogById(logId, userId) {
    try {
      const log = await ExerciseLog.findOne({ _id: logId, userId });
      return log;
    } catch (error) {
      throw new Error(`Error fetching exercise log: ${error.message}`);
    }
  }
}

module.exports = new ExerciseLogService();