const packageService = require('../services/package_service');

class PackageController {
  // Create package
  async createPackage(req, res) {
    try {
      const packageData = req.body;
      
      // Optional: Track who created the package
      if (req.user?.userId) {
        packageData.createdBy = req.user.userId;
      }
      
      const pkg = await packageService.createPackage(packageData);
      
      res.status(201).json({
        success: true,
        message: 'Package created successfully',
        data: pkg
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all packages
  async getAllPackages(req, res) {
    try {
      const { showInactive } = req.query;
      const packages = await packageService.getAllPackages(showInactive === 'true');
      
      res.status(200).json({
        success: true,
        count: packages.length,
        data: packages
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get package by ID
  async getPackageById(req, res) {
    try {
      const { id } = req.params;
      const pkg = await packageService.getPackageById(id);
      
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: pkg
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update package
  async updatePackage(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const pkg = await packageService.updatePackage(id, updateData);
      
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Package updated successfully',
        data: pkg
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete package
  async deletePackage(req, res) {
    try {
      const { id } = req.params;
      const pkg = await packageService.deletePackage(id);
      
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Package deleted successfully',
        data: pkg
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Initialize default packages
  async initializeDefaultPackages(req, res) {
    try {
      const packages = await packageService.ensureDefaultPackages();
      
      res.status(200).json({
        success: true,
        message: 'Default packages initialized',
        data: packages
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PackageController();