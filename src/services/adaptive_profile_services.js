// services/adaptiveProfile.service.js

const AdaptiveProfile = require('../models/adaptive.model');

class AdaptiveProfileService {
  // Create new adaptive profile
  async createAdaptiveProfile(data) {
    try {
      const { affectedLimbs, purposes } = data;

      if (!affectedLimbs || !purposes || purposes.length === 0) {
        throw new Error('Affected limbs and at least one purpose are required');
      }

      const adaptiveProfile = new AdaptiveProfile({
        affectedLimbs,
        purposes
      });

      await adaptiveProfile.save();

      return {
        success: true,
        profileId: adaptiveProfile._id,
        data: adaptiveProfile,
        message: 'Adaptive profile created successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Get adaptive profile by ID
  async getAdaptiveProfileById(profileId) {
    try {
      const profile = await AdaptiveProfile.findById(profileId);

      if (!profile) {
        throw new Error('Adaptive profile not found');
      }

      return {
        success: true,
        data: profile
      };
    } catch (error) {
      throw error;
    }
  }

  // Update adaptive profile
  async updateAdaptiveProfile(profileId, data) {
    try {
      const { affectedLimbs, purposes } = data;

      const profile = await AdaptiveProfile.findById(profileId);

      if (!profile) {
        throw new Error('Adaptive profile not found');
      }

      if (affectedLimbs !== undefined) {
        profile.affectedLimbs = affectedLimbs;
      }

      if (purposes !== undefined) {
        if (!Array.isArray(purposes) || purposes.length === 0) {
          throw new Error('Purposes must be a non-empty array');
        }
        profile.purposes = purposes;
      }

      await profile.save();

      return {
        success: true,
        data: profile,
        message: 'Adaptive profile updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete adaptive profile
  async deleteAdaptiveProfile(profileId) {
    try {
      const profile = await AdaptiveProfile.findByIdAndDelete(profileId);

      if (!profile) {
        throw new Error('Adaptive profile not found');
      }

      return {
        success: true,
        message: 'Adaptive profile deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Add purpose to existing profile
  async addPurpose(profileId, purpose) {
    try {
      const profile = await AdaptiveProfile.findById(profileId);

      if (!profile) {
        throw new Error('Adaptive profile not found');
      }

      if (!profile.purposes.includes(purpose)) {
        profile.purposes.push(purpose);
        await profile.save();
      }

      return {
        success: true,
        data: profile,
        message: 'Purpose added successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Remove purpose from existing profile
  async removePurpose(profileId, purpose) {
    try {
      const profile = await AdaptiveProfile.findById(profileId);

      if (!profile) {
        throw new Error('Adaptive profile not found');
      }

      profile.purposes = profile.purposes.filter(p => p !== purpose);
      
      if (profile.purposes.length === 0) {
        throw new Error('At least one purpose must remain');
      }

      await profile.save();

      return {
        success: true,
        data: profile,
        message: 'Purpose removed successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all adaptive profiles (with pagination)
  async getAllAdaptiveProfiles(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const profiles = await AdaptiveProfile.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await AdaptiveProfile.countDocuments();

      return {
        success: true,
        data: profiles,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AdaptiveProfileService();