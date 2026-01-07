const express = require('express');
const cors = require('cors');

const app = express();

/**
 * Required for cloud hosting (Hostinger / Nginx / VPS)
 */
app.set('trust proxy', 1);

/**
 * CORS Configuration
 */
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [
        'https://yourdomain.com',
        'https://www.yourdomain.com'
      ]
    : '*';

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
  })
);

app.use(express.json());

/**
 * Request logging (DEV ONLY)
 */
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });
}

/**
 * ========================================
 * IMPORT ROUTES
 * ========================================
 */
const adaptiveProfileRoutes = require('../src/routes/adaptive_profile_routes');
const profileRoutes = require('../src/routes/profile_routes');
const goalbaseProgram = require('../src/routes/goal_base_program_routes');
const authRoutes = require('../src/routes/auth.routes');
const fitnessplanRoutes = require('../src/routes/fitness_plan_routes');
const nutritionRoutes = require('../src/routes/nutrition_routes');
const exerciseLogRoutes = require('../src/routes/excercize_tracking_routes');
const progressRoutes = require('../src/routes/plan_tracking_routes');
const statsRoutes = require('../src/routes/stats_route');
const subscriptionRoutes = require('../src/routes/subscription_routes');
const packageRoutes = require('../src/routes/packages_routes');
const paymentRoutes = require('../src/routes/payment_routes');

/**
 * ========================================
 * REGISTER ROUTES
 * ========================================
 */
app.use('/api/adaptive-profile', adaptiveProfileRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/goal-base-programs', goalbaseProgram);
app.use('/api/auth', authRoutes);
app.use('/api/fitness-plan', fitnessplanRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/exercise', exerciseLogRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/payment', paymentRoutes);

/**
 * ========================================
 * BASE & HEALTH ROUTES
 * ========================================
 */
app.get('/', (req, res) => {
  res.send('Fitness Coach API running');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

/**
 * ========================================
 * 404 HANDLER
 * ========================================
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    method: req.method,
    path: req.originalUrl
  });
});

/**
 * ========================================
 * GLOBAL ERROR HANDLER
 * ========================================
 */
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    stack:
      process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;