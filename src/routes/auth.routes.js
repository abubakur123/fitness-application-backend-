// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authController = require('../controllers/auth.controller');

// ========== PUBLIC ROUTES ==========
router.post('/signup/initiate', authController.initiateSignup);
router.post('/signup/complete', authController.completeSignup); 
router.post('/login/initiate', authController.initiateLogin);
router.post('/login/complete', authController.completeLogin);

// ========== PROTECTED ROUTES ==========
// Apply middleware to each protected route individually
router.get('/user/me', authController.verifyToken, authController.getUserById);
router.get('/user/profile/:profileKey', authController.verifyToken, authController.getAuthUserByProfileKey); 
router.post('/profile/link', authController.verifyToken, authController.linkProfile);
router.get('/user/email/:email', authController.verifyToken, authController.getUserByEmail);
router.get('/users/search', authController.verifyToken, authController.searchUsers);
router.delete('/user/:email', authController.verifyToken, authController.deleteUser);
router.get('/user/id/:userId', authController.verifyToken, authController.getUserByUserId);
router.post('/migrate-subscriptions', authController.verifyToken, authController.migrateUserSubscriptions);

// ========== FITNESS PLAN ROUTES (NEW) ==========
router.post('/fitness-plan/add', authController.verifyToken, authController.addFitnessPlan);
router.put('/fitness-plan/update', authController.verifyToken, authController.updateFitnessPlan);

module.exports = router;