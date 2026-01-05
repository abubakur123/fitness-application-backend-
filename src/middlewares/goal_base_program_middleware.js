const GoalBaseProgramValidators = require('../utils/goal_base_program_validator');

const goalBaseProgramMiddleware = {
    
    // Validate program data structure
    validateProgramData: (req, res, next) => {
        const programData = req.body;
        
        if (!programData || typeof programData !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Program data is required'
            });
        }
        
        // Validate data types
        const typeValidation = GoalBaseProgramValidators.validateDataTypes(programData);
        if (!typeValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Data type validation failed',
                errors: typeValidation.errors
            });
        }
        
        next();
    },
    
    // Validate program ID in params
    validateProgramId: (req, res, next) => {
        const programId = req.params.id;
        
        if (!programId) {
            return res.status(400).json({
                success: false,
                message: 'Program ID is required'
            });
        }
        
        // Validate MongoDB ObjectId format
        if (!programId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid program ID format'
            });
        }
        
        next();
    }
};

module.exports = goalBaseProgramMiddleware;