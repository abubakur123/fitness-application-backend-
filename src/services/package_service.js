const Package = require('../models/package_model');

class PackageService {
  // Create a new package
  async createPackage(packageData) {
    const packageDoc = new Package(packageData); // Changed variable name
    return await packageDoc.save(); // Use packageDoc
  }

  // Get package by ID
  async getPackageById(id) {
    return await Package.findById(id);
  }

  // Get all packages (active only by default)
  async getAllPackages(showInactive = false) {
    const query = showInactive ? {} : { isActive: true };
    return await Package.find(query).sort({ price: 1 });
  }

  // Get packages by duration
  async getPackagesByDuration(duration) {
    return await Package.find({ 
      duration,
      isActive: true 
    }).sort({ price: 1 });
  }

  // Update package
  async updatePackage(id, updateData) {
    return await Package.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        updatedAt: Date.now()
      },
      { new: true }
    );
  }

  // Delete package (soft delete)
  async deletePackage(id) {
    return await Package.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        updatedAt: Date.now()
      },
      { new: true }
    );
  }

  // Get default packages (create if not exist)
  async ensureDefaultPackages() {
    const defaultPackages = [
      {
        name: 'Basic Monthly',
        description: 'Perfect for getting started',
        duration: '1_month',
        durationInDays: 30,
        price: 9.99,
        features: [
          { name: 'Feature 1', included: true, description: 'Basic feature' },
          { name: 'Feature 2', included: true, description: 'Another basic feature' }
        ]
      },
      {
        name: 'Pro Quarterly',
        description: 'Best value for regular users',
        duration: '3_months',
        durationInDays: 90,
        price: 24.99,
        discount: 10,
        isPopular: true,
        features: [
          { name: 'Feature 1', included: true, description: 'Basic feature' },
          { name: 'Feature 2', included: true, description: 'Another basic feature' },
          { name: 'Feature 3', included: true, description: 'Pro feature' }
        ]
      },
      {
        name: 'Premium Yearly',
        description: 'Maximum savings for power users',
        duration: '1_year',
        durationInDays: 365,
        price: 89.99,
        discount: 25,
        features: [
          { name: 'Feature 1', included: true, description: 'Basic feature' },
          { name: 'Feature 2', included: true, description: 'Another basic feature' },
          { name: 'Feature 3', included: true, description: 'Pro feature' },
          { name: 'Feature 4', included: true, description: 'Premium feature' }
        ]
      }
    ];

    for (const pkg of defaultPackages) {
      const exists = await Package.findOne({ name: pkg.name });
      if (!exists) {
        await this.createPackage(pkg);
      }
    }

    return await this.getAllPackages();
  }
}

module.exports = new PackageService();