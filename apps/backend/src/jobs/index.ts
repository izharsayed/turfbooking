import cron from 'node-cron';
import { logger } from '../config/logger.js';

export function initializeSchedulerJobs() {
  logger.info('⏰ Initializing background job scheduler...');

  // 1. Check for expired bookings (every minute)
  // Reclaims slots for bookings that have been pending/unpaid past a specific window
  cron.schedule('* * * * *', () => {
    logger.debug('⚙️ Background Job: Checking for expired booking slots...');
    // Query pending bookings > 10 mins and cancel them.
  });

  // 2. Booking Reminders (every hour)
  // Sends notification reminders for upcoming bookings
  cron.schedule('0 * * * *', () => {
    logger.debug('⚙️ Background Job: Processing upcoming booking reminders...');
  });

  // 3. Daily Revenue Report Generation (every midnight)
  cron.schedule('0 0 * * *', () => {
    logger.info('⚙️ Background Job: Generating daily revenue and occupancy reports...');
  });
}
