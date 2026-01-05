const goalBaseProgramService = require('../services/goal_base_program_service');

const goalBaseProgramController = {
    
    // Create a new GoalBase program
    createProgram: async (req, res) => {
        try {
            const programData = req.body;
            
            const program = await goalBaseProgramService.createProgram(programData);
            
            res.status(201).json({
                success: true,
                message: 'GoalBase program created successfully',
                data: { 
                    program,
                    programId: program.id 
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create program'
            });
        }
    },
    
    // Get program by ID
    getProgramById: async (req, res) => {
        try {
            const programId = req.params.id;
            
            const program = await goalBaseProgramService.getProgramById(programId);
            
            res.status(200).json({
                success: true,
                message: 'GoalBase program retrieved successfully',
                data: { program }
            });
        } catch (error) {
            res.status(error.message === 'GoalBase program not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to retrieve program'
            });
        }
    },
    
    // Update entire program
    updateProgram: async (req, res) => {
        try {
            const programId = req.params.id;
            const programData = req.body;
            
            const program = await goalBaseProgramService.updateProgram(programId, programData);
            
            res.status(200).json({
                success: true,
                message: 'GoalBase program updated successfully',
                data: { program }
            });
        } catch (error) {
            res.status(error.message === 'GoalBase program not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to update program'
            });
        }
    },
    
    // Update specific fields in program
    updateProgramPartial: async (req, res) => {
        try {
            const programId = req.params.id;
            const updateData = req.body;
            
            const program = await goalBaseProgramService.updateProgramPartial(programId, updateData);
            
            res.status(200).json({
                success: true,
                message: 'GoalBase program fields updated successfully',
                data: { program }
            });
        } catch (error) {
            res.status(error.message === 'GoalBase program not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to update program fields'
            });
        }
    },
    
    // Delete program
    deleteProgram: async (req, res) => {
        try {
            const programId = req.params.id;
            
            await goalBaseProgramService.deleteProgram(programId);
            
            res.status(200).json({
                success: true,
                message: 'GoalBase program deleted successfully'
            });
        } catch (error) {
            res.status(error.message === 'GoalBase program not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to delete program'
            });
        }
    },
    
    // Get program statistics
    getProgramStats: async (req, res) => {
        try {
            const programId = req.params.id;
            
            const stats = await goalBaseProgramService.getProgramStats(programId);
            
            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(error.message === 'GoalBase program not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to get program statistics'
            });
        }
    }
};

module.exports = goalBaseProgramController;