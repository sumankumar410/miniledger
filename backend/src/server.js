const app = require('./app');
const { env } = require('./config/env');
const prisma = require('./config/db');
const { SchedulerService } = require('./services/scheduler.service');

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 MiniLedger Backend Server is running!`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);

  // Start background reminder scheduler
  SchedulerService.start();
});

// Graceful shutdown
const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  SchedulerService.stop();
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connection disconnected.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

module.exports = server;
