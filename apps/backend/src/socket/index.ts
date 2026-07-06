import { Server, Socket } from 'socket.io';
import { logger } from '../config/logger.js';

let ioInstance: Server | null = null;

export function initializeSocketEvents(io: Server) {
  ioInstance = io;
  
  io.on('connection', (socket: Socket) => {
    logger.info(`🔌 Socket client connected: ${socket.id}`);

    // Join room based on user ID or role
    socket.on('join_room', (room: string) => {
      socket.join(room);
      logger.info(`🔌 Socket client ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket client disconnected: ${socket.id}`);
    });
  });
}

// Global helper to emit events to specific rooms/channels
export function emitSocketEvent(room: string, event: string, payload: any) {
  if (ioInstance) {
    logger.info(`📣 Broadcasting socket event "${event}" to room "${room}"`);
    ioInstance.to(room).emit(event, payload);
  } else {
    logger.warn(`⚠️ Socket.io instance not initialized yet. Skipping event "${event}"`);
  }
}
