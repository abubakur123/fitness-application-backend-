const express = require('express');
const router = express.Router();
const exerciseLogController = require('../controllers/excercize_tracking_controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Create exercise log
router.post('/logs', verifyToken, exerciseLogController.createLog);

// Get specific exercise log by day and exercise number
router.get('/logs/exercise', verifyToken, exerciseLogController.getByDayAndExercise);

// Get all logs with optional filters
router.get('/logs', verifyToken, exerciseLogController.getAllLogs);

// Update exercise log
router.put('/logs/:logId', verifyToken, exerciseLogController.updateLog);

// Delete exercise log
router.delete('/logs/:logId', verifyToken, exerciseLogController.deleteLog);

module.exports = router;