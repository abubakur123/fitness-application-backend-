// controllers/adaptiveProfile.controller.js

const adaptiveProfileService = require('../services/adaptive_profile_services');

class AdaptiveProfileController {
  // Create adaptive profile
  async createProfile(req, res) {
    try {
      const { affectedLimbs, purposes } = req.body;

      if (!affectedLimbs || !purposes) {
        return res.status(400).json({
          success: false,
          message: 'Affected limbs and purposes are required'
        });
      }

      if (!Array.isArray(purposes) || purposes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Purposes must be a non-empty array'
        });
      }

      const result = await adaptiveProfileService.createAdaptiveProfile({
        affectedLimbs,
        purposes
      });

      return res.status(201).json({
        success: true,
        message: result.message,
        profileId: result.profileId,
        data: result.data
      });
    } catch (error) {
      console.error('Error in createProfile:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create adaptive profile'
      });
    }
  }

  // Get adaptive profile by ID
  async getProfile(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Profile ID is required'
        });
      }

      const result = await adaptiveProfileService.getAdaptiveProfileById(id);

      return res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Error in getProfile:', error);
      
      if (error.message === 'Adaptive profile not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve adaptive profile'
      });
    }
  }

  // Update adaptive profile
  async updateProfile(req, res) {
    try {
      const { id } = req.params;
      const { affectedLimbs, purposes } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Profile ID is required'
        });
      }

      const result = await adaptiveProfileService.updateAdaptiveProfile(id, {
        affectedLimbs,
        purposes
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error in updateProfile:', error);

      if (error.message === 'Adaptive profile not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update adaptive profile'
      });
    }
  }

  // Delete adaptive profile
  async deleteProfile(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Profile ID is required'
        });
      }

      const result = await adaptiveProfileService.deleteAdaptiveProfile(id);

      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error in deleteProfile:', error);

      if (error.message === 'Adaptive profile not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete adaptive profile'
      });
    }
  }

  // Add purpose to profile
  async addPurpose(req, res) {
    try {
      const { id } = req.params;
      const { purpose } = req.body;

      if (!id || !purpose) {
        return res.status(400).json({
          success: false,
          message: 'Profile ID and purpose are required'
        });
      }

      const result = await adaptiveProfileService.addPurpose(id, purpose);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error in addPurpose:', error);

      if (error.message === 'Adaptive profile not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to add purpose'
      });
    }
  }

  // Remove purpose from profile
  async removePurpose(req, res) {
    try {
      const { id } = req.params;
      const { purpose } = req.body;

      if (!id || !purpose) {
        return res.status(400).json({
          success: false,
          message: 'Profile ID and purpose are required'
        });
      }

      const result = await adaptiveProfileService.removePurpose(id, purpose);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error in removePurpose:', error);

      if (error.message === 'Adaptive profile not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to remove purpose'
      });
    }
  }

  // Get all profiles with pagination
  async getAllProfiles(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await adaptiveProfileService.getAllAdaptiveProfiles(page, limit);

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in getAllProfiles:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve profiles'
      });
    }
  }
}

module.exports = new AdaptiveProfileController();