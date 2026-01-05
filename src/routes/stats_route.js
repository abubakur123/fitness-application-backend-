const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats_controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(verifyToken);

// ==================== EXERCISE STATS ROUTES ====================

// Get exercise summary statistics
// Query params: period (default: 7 days)
router.get('/exercise/summary', statsController.getExerciseStats);

// Get exercise completion statistics
// Query params: period (default: 7 days)
router.get('/exercise/completion', statsController.getExerciseCompletionStats);

// Get exercise timeline statistics
// Query params: period (default: 30 days)
router.get('/exercise/timeline', statsController.getExerciseTimelineStats);

// ==================== NUTRITION STATS ROUTES ====================

// Get nutrition summary statistics
// URL params: period (week, month, 6months)
router.get('/nutrition/summary/:period', statsController.getNutritionSummary);

// Get nutrition calendar view
// URL params: year, month
router.get('/nutrition/calendar/:year/:month', statsController.getNutritionCalendar);

// ==================== COMBINED STATS ROUTES ====================

// Get overall dashboard statistics (combines exercise and nutrition)
// Query params: period (default: 7 days)
router.get('/dashboard', statsController.getDashboardStats);

module.exports = router;