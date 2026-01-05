const Profile = require('../models/profile_model');
const mongoose = require('mongoose');

class ProfileService {
  // Create a new profile
  async createProfile(profileData) {
    try {
      // Validate that only one program type is provided
      if (profileData.adaptiveProfile && profileData.goalBasedProgram) {
        throw new Error('Profile can have either adaptiveProfile or goalBasedProgram, not both');
      }

      const profile = new Profile(profileData);
      await profile.save();
      return profile;
    } catch (error) {
      throw error;
    }
  }

  // Get profile by ID
  async getProfileById(profileId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(profileId)) {
        throw new Error('Invalid profile ID');
      }

      const profile = await Profile.findById(profileId)
        .populate('adaptiveProfile')
        .populate('goalBasedProgram');
      
      if (!profile) {
        throw new Error('Profile not found');
      }

      return profile;
    } catch (error) {
      throw error;
    }
  }

  // Get all profiles
  async getAllProfiles(query = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const profiles = await Profile.find(query)
        .populate('adaptiveProfile')
        .populate('goalBasedProgram')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Profile.countDocuments(query);

      return {
        profiles,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Update profile by ID
  async updateProfile(profileId, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(profileId)) {
        throw new Error('Invalid profile ID');
      }

      // Validate that only one program type is being set
      if (updateData.adaptiveProfile && updateData.goalBasedProgram) {
        throw new Error('Profile can have either adaptiveProfile or goalBasedProgram, not both');
      }

      // If setting one program, clear the other
      if (updateData.adaptiveProfile) {
        updateData.goalBasedProgram = null;
      } else if (updateData.goalBasedProgram) {
        updateData.adaptiveProfile = null;
      }

      const profile = await Profile.findByIdAndUpdate(
        profileId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('adaptiveProfile')
        .populate('goalBasedProgram');

      if (!profile) {
        throw new Error('Profile not found');
      }

      return profile;
    } catch (error) {
      throw error;
    }
  }

  // Delete profile by ID
  async deleteProfile(profileId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(profileId)) {
        throw new Error('Invalid profile ID');
      }

      const profile = await Profile.findByIdAndDelete(profileId);

      if (!profile) {
        throw new Error('Profile not found');
      }

      return profile;
    } catch (error) {
      throw error;
    }
  }

  // Get profiles by program type
  async getProfilesByProgramType(programType) {
    try {
      const query = {};
      
      if (programType === 'adaptive') {
        query.adaptiveProfile = { $ne: null };
      } else if (programType === 'goalBased') {
        query.goalBasedProgram = { $ne: null };
      } else {
        throw new Error('Invalid program type. Use "adaptive" or "goalBased"');
      }

      const profiles = await Profile.find(query)
        .populate('adaptiveProfile')
        .populate('goalBasedProgram');

      return profiles;
    } catch (error) {
      throw error;
    }
  }

  // Assign program to profile
  async assignProgram(profileId, programId, programType) {
    try {
      if (!mongoose.Types.ObjectId.isValid(profileId) || !mongoose.Types.ObjectId.isValid(programId)) {
        throw new Error('Invalid profile or program ID');
      }

      const updateData = {};
      
      if (programType === 'adaptive') {
        updateData.adaptiveProfile = programId;
        updateData.goalBasedProgram = null;
      } else if (programType === 'goalBased') {
        updateData.goalBasedProgram = programId;
        updateData.adaptiveProfile = null;
      } else {
        throw new Error('Invalid program type. Use "adaptive" or "goalBased"');
      }

      const profile = await Profile.findByIdAndUpdate(
        profileId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('adaptiveProfile')
        .populate('goalBasedProgram');

      if (!profile) {
        throw new Error('Profile not found');
      }

      return profile;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProfileService();