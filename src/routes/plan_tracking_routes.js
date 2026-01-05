const express = require('express');
const router = express.Router();
const dayProgressController = require('../controllers/plan_tracking_Controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

/**
 * @route   GET /api/progress/current
 * @desc    Get current day progress (latest tracked day)
 * @access  Private
 */
router.get('/current', dayProgressController.getCurrentDayProgress);

/**
 * @route   GET /api/progress/day/:day
 * @desc    Get progress for a specific day
 * @access  Private
 * @param   {number} day - Day number (1, 2, 3, etc.)
 */
router.get('/day/:day', dayProgressController.getDayProgress);

/**
 * @route   GET /api/progress/range
 * @desc    Get progress for a range of days
 * @access  Private
 * @query   {number} startDay - Starting day number
 * @query   {number} endDay - Ending day number
 * @example /api/progress/range?startDay=1&endDay=7
 */
router.get('/range', dayProgressController.getProgressRange);

/**
 * @route   GET /api/progress/week/:weekNumber
 * @desc    Get weekly progress summary
 * @access  Private
 * @param   {number} weekNumber - Week number (1, 2, 3, etc.)
 */
router.get('/week/:weekNumber', dayProgressController.getWeeklyProgress);

/**
 * @route   GET /api/progress/overall
 * @desc    Get overall program progress summary
 * @access  Private
 */
router.get('/overall', dayProgressController.getOverallProgress);

/**
 * @route   POST /api/progress/refresh
 * @desc    Refresh/Update day progress (call after logging exercise or nutrition)
 * @access  Private
 * @body    {number} day - Day number to refresh
 */
router.post('/refresh', dayProgressController.refreshDayProgress);

/**
 * @route   DELETE /api/progress/day/:day
 * @desc    Delete day progress (for cleanup/testing)
 * @access  Private
 * @param   {number} day - Day number to delete
 */
router.delete('/day/:day', dayProgressController.deleteDayProgress);

module.exports = router;