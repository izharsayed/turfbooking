import { createClient } from 'redis';
import { env } from './env.js';
import { logger } from './logger.js';

const getRedisClient = () => {
  const redisUrl = env.REDIS_URL;

  if (!redisUrl) {
    logger.warn('⚠️ REDIS_URL is not defined. Redis operations will fail.');
    return null;
  }

  const client = createClient({ url: redisUrl });

  client.on('error', (err) => {
    logger.error('❌ Redis client connection error:', err);
  });

  client.on('connect', () => {
    logger.info('💾 Redis connection established successfully');
  });

  client.connect().catch((err) => {
    logger.error('❌ Failed to connect to Redis server:', err);
  });

  return client;
};

export const redisClient: any = getRedisClient();
