require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    if (process.env.NODE_ENV === 'production') {
      // In production: DB MUST connect or app should not start
      await connectDB();
      console.log('✅ MongoDB Connected (production)');
    } else {
      // In development: allow app to run even if DB fails
      try {
        await connectDB();
        console.log('✅ MongoDB Connected (development)');
      } catch (err) {
        console.warn('⚠️ MongoDB not connected (development mode)');
      }
    }

    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('🛑 Shutting down server...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
