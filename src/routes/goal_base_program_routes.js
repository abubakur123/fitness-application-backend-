const express = require('express');
const router = express.Router();
const goalBaseProgramController = require('../controllers/goal_base_program_controller');
const goalBaseProgramMiddleware = require('../middlewares/goal_base_program_middleware');

// ==================== CREATE ====================
router.post(
    '/',
    goalBaseProgramMiddleware.validateProgramData,
    goalBaseProgramController.createProgram
);

// ==================== READ ====================
// Get program by ID
router.get(
    '/:id',
    goalBaseProgramMiddleware.validateProgramId,
    goalBaseProgramController.getProgramById
);

// Get program statistics
router.get(
    '/:id/stats',
    goalBaseProgramMiddleware.validateProgramId,
    goalBaseProgramController.getProgramStats
);

// ==================== UPDATE ====================
// Update entire program
router.put(
    '/:id',
    goalBaseProgramMiddleware.validateProgramId,
    goalBaseProgramMiddleware.validateProgramData,
    goalBaseProgramController.updateProgram
);

// Update partial program
router.patch(
    '/:id',
    goalBaseProgramMiddleware.validateProgramId,
    goalBaseProgramController.updateProgramPartial
);

// ==================== DELETE ====================
router.delete(
    '/:id',
    goalBaseProgramMiddleware.validateProgramId,
    goalBaseProgramController.deleteProgram
);

module.exports = router;