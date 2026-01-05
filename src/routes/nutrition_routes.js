const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/nutrition_controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Store 1 meal at a time
router.post('/meal', nutritionController.updateSingleMeal);

// Create/Update nutrition data
router.post('/', nutritionController.createOrUpdateNutrition);

// Update meal status
router.put('/meal-status', nutritionController.updateMealStatus);

// Get nutrition by period
router.get('/period/:period', nutritionController.getNutritionByPeriod);

// Get specific day nutrition
router.get('/day/:day', nutritionController.getDayNutrition);

// Get nutrition by date range
router.get('/range', nutritionController.getNutritionByRange);

module.exports = router;