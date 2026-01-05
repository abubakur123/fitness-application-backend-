const fitnessplanService = require('../services/fitness_plan_service');

class FitnessPlanController {
  
  // Generate fitness plan
  async generatePlan(req, res) {
    try {
      const { profileId } = req.body;

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: 'profileId is required'
        });
      }

      const result = await fitnessplanService.generateFitnessPlan(profileId);

      res.status(200).json(result);

    } catch (error) {
      console.error('Controller Error - generatePlan:', error);
      
      // Handle specific error messages
      if (error.message === 'Profile not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message === 'No program (adaptive or goal-based) found for this profile') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to generate fitness plan',
        error: error.message
      });
    }
  }

  // Get only exercises with their steps
  async getAllExercisesWithSteps(req, res) {
    try {
      const result = await fitnessplanService.getAllExercisesWithSteps();

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Controller Error - getAllExercisesWithSteps:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exercises with steps',
        error: error.message
      });
    }
  }

  // Get all unique workout and exercise names
  async getAllWorkoutNames(req, res) {
    try {
      const result = await fitnessplanService.getAllWorkoutNames();

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Controller Error - getAllWorkoutNames:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch workout names',
        error: error.message
      });
    }
  }

  // Get detailed workout and exercise information
  async getAllWorkoutsDetailed(req, res) {
    try {
      const result = await fitnessplanService.getAllWorkoutsDetailed();

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Controller Error - getAllWorkoutsDetailed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch detailed workout information',
        error: error.message
      });
    }
  }

  // Get fitness plan by profileId
  async getPlan(req, res) {
    try {
      const { profileId } = req.params;

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: 'profileId is required'
        });
      }

      const fitnessPlan = await fitnessplanService.getFitnessPlan(profileId);

      if (!fitnessPlan) {
        return res.status(404).json({
          success: false,
          message: 'No fitness plan found for this profile'
        });
      }

      res.status(200).json({
        success: true,
        data: fitnessPlan
      });

    } catch (error) {
      console.error('Controller Error - getPlan:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fitness plan',
        error: error.message
      });
    }
  }

  // Get fitness plan by planId
  async getPlanById(req, res) {
    try {
      const { planId } = req.params;

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: 'planId is required'
        });
      }

      const fitnessPlan = await fitnessplanService.getFitnessPlanById(planId);

      if (!fitnessPlan) {
        return res.status(404).json({
          success: false,
          message: 'Fitness plan not found'
        });
      }

      res.status(200).json({
        success: true,
        data: fitnessPlan
      });

    } catch (error) {
      console.error('Controller Error - getPlanById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fitness plan',
        error: error.message
      });
    }
  }

    // Delete fitness plan by planId
  async deletePlan(req, res) {
    try {
      const { planId } = req.params;

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: 'planId is required'
        });
      }

      const result = await fitnessplanService.deleteFitnessPlan(planId);

      res.status(200).json(result);

    } catch (error) {
      console.error('Controller Error - deletePlan:', error);
      
      if (error.message === 'Fitness plan not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete fitness plan',
        error: error.message
      });
    }
  }

  // Get all fitness plans
  async getAllPlans(req, res) {
    try {
      const fitnessPlans = await fitnessplanService.getAllFitnessPlans();

      res.status(200).json({
        success: true,
        count: fitnessPlans.length,
        data: fitnessPlans
      });

    } catch (error) {
      console.error('Controller Error - getAllPlans:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fitness plans',
        error: error.message
      });
    }
  }

  // Get fitness plan by user email
  async getPlanByEmail(req, res) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'email is required'
        });
      }

      const fitnessPlan = await fitnessplanService.getFitnessPlanByEmail(email);

      res.status(200).json({
        success: true,
        data: fitnessPlan
      });

    } catch (error) {
      console.error('Controller Error - getPlanByEmail:', error);
      
      if (error.message === 'User not found' || 
          error.message === 'User has no profile' || 
          error.message === 'No fitness plan found for this user') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch fitness plan',
        error: error.message
      });
    }
  }
}

module.exports = new FitnessPlanController();