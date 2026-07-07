import { logger } from '../config/logger.js';

const provider = process.env.DATABASE_PROVIDER || 'prisma';

// Lazily initialize PrismaClient only when using the Prisma provider.
// This prevents import-time crashes when running in Firebase mode.
let _prisma: any = null;

export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      if (!_prisma) {
        if (provider === 'firebase') {
          // Return no-op stubs for lifecycle methods used in server.ts
          if (prop === '$connect' || prop === '$disconnect') {
            return () => Promise.resolve();
          }
          return undefined;
        }

        // Lazily require PrismaClient only in Prisma mode
        const { PrismaClient } = require('@prisma/client');
        _prisma = new PrismaClient({
          log: [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
          ],
        });

        if (process.env.NODE_ENV === 'development') {
          (_prisma as any).$on('query', (e: any) => {
            logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
          });
        }
      }

      const value = _prisma[prop];
      return typeof value === 'function' ? value.bind(_prisma) : value;
    },
  }
) as any;
