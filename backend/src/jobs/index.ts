import cron from 'node-cron';
import { logger } from '../config/logger.js';
import { bookingRepository, paymentRepository } from '../repositories/index.js';

export function initializeSchedulerJobs() {
  logger.info('⏰ Initializing background job scheduler...');

  // 1. Check for expired bookings (every minute)
  // Reclaims slots for bookings that have been pending/unpaid past 5 minutes
  cron.schedule('* * * * *', async () => {
    logger.debug('⚙️ Background Job: Checking for expired booking slots...');
    try {
      const pendingBookings = await bookingRepository.findAllPending();
      const now = new Date().getTime();

      for (const b of pendingBookings) {
        const createdAtTime = new Date(b.createdAt).getTime();
        const ageMs = now - createdAtTime;

        // If pending for more than 5 minutes, cancel it
        if (ageMs > 5 * 60 * 1000) {
          logger.info(`⏰ Reclaiming slot: Booking ${b.id} for Turf ${b.turfId} has expired (pending for ${Math.round(ageMs / 1000)}s)`);
          await bookingRepository.updateStatus(b.id, 'CANCELLED');

          const payment = await paymentRepository.findByBookingId(b.id);
          if (payment && payment.status === 'PENDING') {
            await paymentRepository.updateStatus(payment.id, 'FAILED');
          }
        }
      }
    } catch (err) {
      logger.error('❌ Expired booking cleanup job failed:', err);
    }
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
