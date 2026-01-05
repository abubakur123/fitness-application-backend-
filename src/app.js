const express = require('express');
const cors = require('cors');

const app = express();

// Configure CORS to allow all origins (for development)
app.use(cors({
  origin: '*', // Allow all origins during development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false
}));

// Or for more specific control during development:
// app.use(cors({
//   origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081'],
//   credentials: true
// }));

app.use(express.json());

// Debug middleware - move it before routes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log('Origin:', req.headers.origin || 'No origin header');
  console.log('Host:', req.headers.host);
  next();
});

// ========================================
// IMPORT ROUTES
// ========================================
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
const paymentRoutes =require('../src/routes/payment_routes');

// ========================================
// REGISTER ROUTES
// ========================================
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

// ========================================
// BASE ROUTE
// ========================================
app.get('/', (req, res) => {
  res.send('Fitness Coach API running');
});

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    ip: req.ip,
    host: req.headers.host
  });
});

// Handle preflight requests
app.options('*', cors());

// 404 Handler - Must be after all routes
app.use((req, res) => {
  console.log(`404: Route not found - ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.url,
    method: req.method
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;