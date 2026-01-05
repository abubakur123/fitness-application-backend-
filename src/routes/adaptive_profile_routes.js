// routes/adaptiveProfile.routes.js

const express = require('express');
const router = express.Router();
const adaptiveProfileController = require('../controllers/adaptive_profile_controller');

// Create a new adaptive profile
// POST /api/adaptive-profile/create
router.post('/create', adaptiveProfileController.createProfile);

// Get all adaptive profiles with pagination
// GET /api/adaptive-profile/list?page=1&limit=10
router.get('/list', adaptiveProfileController.getAllProfiles);

// Get a specific adaptive profile by ID
// GET /api/adaptive-profile/view/:id
router.get('/view/:id', adaptiveProfileController.getProfile);

// Update a specific adaptive profile
// PUT /api/adaptive-profile/update/:id
router.put('/update/:id', adaptiveProfileController.updateProfile);

// Delete a specific adaptive profile
// DELETE /api/adaptive-profile/delete/:id
router.delete('/delete/:id', adaptiveProfileController.deleteProfile);

// Add a purpose to a specific adaptive profile
// POST /api/adaptive-profile/:id/add-purpose
router.post('/:id/add-purpose', adaptiveProfileController.addPurpose);

// Remove a purpose from a specific adaptive profile
// DELETE /api/adaptive-profile/:id/remove-purpose
router.delete('/:id/remove-purpose', adaptiveProfileController.removePurpose);

module.exports = router;
