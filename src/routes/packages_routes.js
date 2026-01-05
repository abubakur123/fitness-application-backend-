const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package_controller');
const packageValidators = require('../utils/package_validators');
const validateRequest = require('../middlewares/validator_middleware');
const authMiddleware = require('../middlewares/auth.middleware');

// Get all packages (public access - no auth required)
router.get(
  '/',
  packageValidators.getAllPackages,
  validateRequest,
  packageController.getAllPackages
);

// Get package by ID (public access - no auth required)
router.get(
  '/:id',
  packageValidators.getPackageById,
  validateRequest,
  packageController.getPackageById
);

// Create package (admin only - requires authentication)
router.post(
  '/create',
  authMiddleware.verifyToken,
  packageValidators.createPackage,
  validateRequest,
  packageController.createPackage
);

// Update package (admin only - requires authentication)
router.put(
  '/update/:id',
  authMiddleware.verifyToken,
  packageValidators.updatePackage,
  validateRequest,
  packageController.updatePackage
);

// Delete package (admin only - requires authentication)
router.delete(
  '/delete/:id',
  authMiddleware.verifyToken,
  packageValidators.deletePackage,
  validateRequest,
  packageController.deletePackage
);

// Initialize default packages (admin only - requires authentication)
router.post(
  '/initialize/default',
  authMiddleware.verifyToken,
  packageController.initializeDefaultPackages
);

module.exports = router;