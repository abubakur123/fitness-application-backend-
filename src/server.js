require('dotenv').config();
const app = require('./app');

const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

// Function to start the server, independent of the database
async function startServer() {
  try {
    // Attempt to connect to MongoDB, but don't let failure stop the server
    await connectDB();
    console.log('✅ MongoDB Connected');
  } catch (dbError) {
    // Log the error but continue to start the Express server
    console.error('⚠️  MongoDB connection failed:', dbError.message);
    console.log('💡 Server starting in offline mode. API will run without database persistence.');
  }

  // Start the Express server regardless of DB connection status
  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Access via:`);
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   Network: http://192.168.100.94:${PORT}`);
    
    // Get network IP addresses
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    
    Object.keys(networkInterfaces).forEach(interfaceName => {
      networkInterfaces[interfaceName].forEach(interface => {
        // Note: In newer Node.js versions, the property might be `family: 'IPv4'`
        // instead of `interface.family === 'IPv4'`. Using .includes() is safer.
        if ((interface.family === 'IPv4' || interface.family === 4) && !interface.internal) {
          console.log(`   Network: http://${interface.address}:${PORT}`);
        }
      });
    });
  });

  return server;
}

// Handle any uncaught errors during server startup
startServer().catch((error) => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});