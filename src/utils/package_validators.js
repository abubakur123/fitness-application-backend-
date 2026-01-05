const { body, param, query } = require('express-validator');

const DURATIONS = ['1_month', '3_months', '6_months', '1_year', 'custom'];

const packageValidators = {
  createPackage: [
    body('name').notEmpty().trim().withMessage('Package name is required'),
    body('description').optional().trim(),

    body('duration')
      .isIn(DURATIONS)
      .withMessage('Invalid duration'),

    body('durationInDays')
      .isInt({ min: 1 })
      .withMessage('Duration in days must be a positive integer'),

    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),

    body('currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'])
      .withMessage('Invalid currency'),

    body('discount')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Discount must be between 0 and 100'),

    body('isActive').optional().isBoolean(),
    body('isPopular').optional().isBoolean(),
    body('features').optional().isArray()
  ],

  updatePackage: [
    param('id').isMongoId().withMessage('Invalid package ID'),

    body('name').optional().notEmpty().trim(),
    body('description').optional().trim(),

    body('duration')
      .optional()
      .isIn(DURATIONS),

    body('durationInDays').optional().isInt({ min: 1 }),
    body('price').optional().isFloat({ min: 0 }),
    body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']),
    body('discount').optional().isFloat({ min: 0, max: 100 }),
    body('isActive').optional().isBoolean(),
    body('isPopular').optional().isBoolean(),
    body('features').optional().isArray()
  ],

  getPackageById: [
    param('id').isMongoId().withMessage('Invalid package ID')
  ],

  deletePackage: [
    param('id').isMongoId().withMessage('Invalid package ID')
  ],

  getAllPackages: [
    query('showInactive').optional().isIn(['true', 'false'])
  ]
};

module.exports = packageValidators;
