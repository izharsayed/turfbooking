import http from 'http';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import app from './app.js';
import { logger } from './config/logger.js';
import { prisma } from './database/index.js';

const server = http.createServer(app);

import { initializeSocketEvents } from './socket/index.js';

// Socket.io Server Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

initializeSocketEvents(io);

const startServer = async () => {
  try {
    // Verify Database Connection (skip for Firebase provider)
    if (env.DATABASE_PROVIDER !== 'firebase') {
      await prisma.$connect();
      logger.info('💾 Database connection established successfully');
    } else {
      logger.info('🔥 Using Firebase as database provider — skipping Prisma connection');
    }

    // Start background schedulers
    const { initializeSchedulerJobs } = await import('./jobs/index.js');
    initializeSchedulerJobs();

    server.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`📄 API Docs available at http://localhost:${env.PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (err: Error) => {
  logger.error('🔴 UNHANDLED REJECTION! Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err: Error) => {
  logger.error('🔴 UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.stack || err.message || String(err));
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('🛑 SIGTERM/SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    if (env.DATABASE_PROVIDER !== 'firebase') {
      await prisma.$disconnect();
      logger.info('💾 Database connection closed');
    }
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();
export { io };
