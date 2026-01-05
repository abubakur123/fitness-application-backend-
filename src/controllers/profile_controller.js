const profileService = require('../services/profile_service');

class ProfileController {
  // Create a new profile
  async createProfile(req, res) {
    try {
      const profile = await profileService.createProfile(req.body);
      res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        data: profile
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create profile',
        error: error.message
      });
    }
  }

  // Get profile by ID
  async getProfile(req, res) {
    try {
      const profile = await profileService.getProfileById(req.params.id);
      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      const statusCode = error.message === 'Profile not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve profile',
        error: error.message
      });
    }
  }

  // Get all profiles
  async getAllProfiles(req, res) {
    try {
      const query = {};
      
      // Optional filters
      if (req.query.gender) query.gender = req.query.gender;
      if (req.query.commitment) query.commitment = req.query.commitment;

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await profileService.getAllProfiles(query, options);
      
      res.status(200).json({
        success: true,
        data: result.profiles,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to retrieve profiles',
        error: error.message
      });
    }
  }

  // Update profile
  async updateProfile(req, res) {
    try {
      const profile = await profileService.updateProfile(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profile
      });
    } catch (error) {
      const statusCode = error.message === 'Profile not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update profile',
        error: error.message
      });
    }
  }

  // Delete profile
  async deleteProfile(req, res) {
    try {
      await profileService.deleteProfile(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Profile deleted successfully'
      });
    } catch (error) {
      const statusCode = error.message === 'Profile not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete profile',
        error: error.message
      });
    }
  }

  // Get profiles by program type
  async getProfilesByProgramType(req, res) {
    try {
      const { type } = req.params;
      const profiles = await profileService.getProfilesByProgramType(type);
      res.status(200).json({
        success: true,
        data: profiles
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to retrieve profiles',
        error: error.message
      });
    }
  }

  // Assign program to profile
  async assignProgram(req, res) {
    try {
      const { id } = req.params;
      const { programId, programType } = req.body;

      if (!programId || !programType) {
        return res.status(400).json({
          success: false,
          message: 'programId and programType are required'
        });
      }

      const profile = await profileService.assignProgram(id, programId, programType);
      res.status(200).json({
        success: true,
        message: 'Program assigned successfully',
        data: profile
      });
    } catch (error) {
      const statusCode = error.message === 'Profile not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to assign program',
        error: error.message
      });
    }
  }
}

module.exports = new ProfileController();