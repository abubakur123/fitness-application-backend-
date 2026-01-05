const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile_controller');

// Create a new profile
router.post('/create', profileController.createProfile);

// Get all profiles (with optional filters and pagination)
router.get('/getall', profileController.getAllProfiles);

// Get profile by ID
router.get('/get-profile/:id', profileController.getProfile);

// Update profile by ID
router.put('/update-profile/:id', profileController.updateProfile);

// Partially update profile by ID
router.patch('/:id', profileController.updateProfile);

// Delete profile by ID
router.delete('/delete/:id', profileController.deleteProfile);

// Get profiles by program type (adaptive or goalBased)
router.get('/program-type/:type', profileController.getProfilesByProgramType);

// Assign program to profile
router.post('/:id/assign-program', profileController.assignProgram);

module.exports = router;