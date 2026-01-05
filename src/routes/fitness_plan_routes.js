const express = require('express');
const router = express.Router();
const fitnessplanController = require('../controllers/fitness_plan_controller');

// Generate fitness plan
router.post('/generate', fitnessplanController.generatePlan);

// Get all fitness plans
router.get('/all', fitnessplanController.getAllPlans);

// Get all workout names (simple list)
router.get('/workouts/names', fitnessplanController.getAllWorkoutNames);

// Get detailed workout and exercise information with steps
router.get('/workouts/detailed', fitnessplanController.getAllWorkoutsDetailed);

// Get only exercises with their steps (simplified)
router.get('/exercises/steps', fitnessplanController.getAllExercisesWithSteps);

// Get fitness plan by user email
router.get('/email/:email', fitnessplanController.getPlanByEmail);

// Get fitness plan by planId
router.get('/plan/:planId', fitnessplanController.getPlanById);

// Delete fitness plan by planId
router.delete('/plan/delete/:planId', fitnessplanController.deletePlan);

// Get fitness plan by profileId (KEEP THIS LAST)
router.get('/:profileId', fitnessplanController.getPlan);

module.exports = router;