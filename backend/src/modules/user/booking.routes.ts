import { Router } from 'express';
import { bookingRepository, turfRepository, paymentRepository } from '../../repositories/index.js';
import { sendResponse } from '../../shared/utils/response.js';
import { authenticate } from '../../middlewares/auth.js';
import { NotFoundError } from '../../shared/utils/errors.js';
import Razorpay from 'razorpay';
import { env } from '../../config/env.js';
import crypto from 'crypto';
import { logger } from '../../config/logger.js';

const router = Router();

// Initialize Razorpay if credentials exist
const razorpay = (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET)
  ? new (Razorpay as any)({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    })
  : null;

/**
 * @openapi
 * /bookings:
 *   get:
 *     summary: Retrieve booking history for authenticated customer
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 */
router.get('/', authenticate as any, async (req: any, res, next) => {
  try {
    const rawBookings = await bookingRepository.findByUserId(req.user.id);
    
    // Enrich bookings with Turf details
    const bookings = await Promise.all(
      rawBookings.map(async (b) => {
        const turf = await turfRepository.findById(b.turfId);
        return {
          id: b.id,
          turfId: b.turfId,
          turfName: turf?.name || 'Unknown Turf',
          area: turf?.location?.address || 'Ahmednagar',
          amount: b.totalAmount,
          status: b.status === 'CONFIRMED' ? 'active' : b.status === 'COMPLETED' ? 'completed' : 'cancelled',
          date: b.bookingDate ? new Date(b.bookingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          time: (b as any).timeSlot || b.slotId || '17:00 - 18:00',
          timestamp: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        };
      })
    );

    return sendResponse(res, 200, true, 'User bookings retrieved successfully', bookings);
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /bookings:
 *   post:
 *     summary: Create a new customer booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - turfId
 *               - amount
 *             properties:
 *               turfId:
 *                 type: string
 *               slotId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post('/', authenticate as any, async (req: any, res, next) => {
  try {
    const { turfId, slotId, amount, totalAmount, time, date, bookingDate } = req.body;
    
    const targetDate = date || bookingDate || new Date().toISOString().split('T')[0];
    const targetSlots = (slotId || time || '17:00 - 18:00').split(',');

    // Check existing bookings for this turf to verify slots are not already booked or reserved
    const existingBookings = await bookingRepository.findByTurfId(turfId);
    const now = new Date().getTime();

    const conflict = existingBookings.find((b) => {
      const bDate = b.bookingDate ? new Date(b.bookingDate).toISOString().split('T')[0] : '';
      if (bDate !== targetDate) return false;

      const bookedSlots = (b.slotId || '').split(',');
      const hasOverlap = targetSlots.some((slot: string) => bookedSlots.includes(slot));
      if (!hasOverlap) return false;

      // If already confirmed, it's a conflict
      if (b.status === 'CONFIRMED') return true;

      // If pending and created less than 5 minutes ago, it's a conflict (temporary reservation active)
      if (b.status === 'PENDING') {
        const createdAtTime = new Date(b.createdAt).getTime();
        const ageMs = now - createdAtTime;
        if (ageMs < 5 * 60 * 1000) {
          return true;
        }
      }

      return false;
    });

    if (conflict) {
      return sendResponse(res, 400, false, 'One or more of the selected slots are already booked or temporarily reserved by another user. Please choose other slots.');
    }

    // 1. Create booking in PENDING status (requires payment verification)
    const booking = await bookingRepository.create({
      userId: req.user.id,
      turfId,
      slotId: slotId || time || '17:00 - 18:00',
      totalAmount: totalAmount || amount,
      status: 'PENDING',
      bookingDate: date || bookingDate || new Date(),
    });

    // 2. Generate Mock Order ID
    const razorpayOrderId = `order_mock_${Math.random().toString(36).substring(2, 15)}`;

    // 3. Create Payment record in PENDING status
    await paymentRepository.create({
      bookingId: booking.id,
      userId: req.user.id,
      amount,
      razorpayOrderId,
      status: 'PENDING',
    });

    return sendResponse(res, 201, true, 'Booking initiated successfully', {
      booking,
      razorpayOrderId,
      amount,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /bookings/verify:
 *   post:
 *     summary: Verify payment signature and confirm booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - status
 *             properties:
 *               bookingId:
 *                 type: string
 *               razorpayOrderId:
 *                 type: string
 *               razorpayPaymentId:
 *                 type: string
 *               razorpaySignature:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed
 */
router.post('/verify', authenticate as any, async (req: any, res, next) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, status } = req.body;

    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const payment = await paymentRepository.findByBookingId(bookingId);
    if (!payment) {
      throw new NotFoundError('Payment record not found');
    }

    if (status === 'FAILED') {
      await bookingRepository.updateStatus(bookingId, 'CANCELLED');
      await paymentRepository.updateStatus(payment.id, 'FAILED');
      return sendResponse(res, 200, false, 'Payment failed. Booking cancelled.');
    }



    // Payment Successful -> Update states to CONFIRMED / PAID
    await bookingRepository.updateStatus(bookingId, 'CONFIRMED');
    await paymentRepository.updateStatus(payment.id, 'PAID', {
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || 'mock-signature',
    });

    // Send confirmation notification (simulate by logging)
    logger.info(`🔔 Booking Confirmed notification sent for Booking ID: ${bookingId}, User: ${req.user.id}, Turf: ${booking.turfId}, Slots: ${booking.slotId}`);

    return sendResponse(res, 200, true, 'Payment verified and booking confirmed successfully');
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /bookings/{id}:
 *   get:
 *     summary: Retrieve single booking details
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 */
router.get('/:id', authenticate as any, async (req: any, res, next) => {
  try {
    const b = await bookingRepository.findById(req.params.id);
    if (!b || b.userId !== req.user.id) {
      throw new NotFoundError('Booking not found');
    }
    const turf = await turfRepository.findById(b.turfId);
    const result = {
      id: b.id,
      turfId: b.turfId,
      turfName: turf?.name || 'Unknown Turf',
      area: turf?.location?.address || 'Ahmednagar',
      amount: b.totalAmount,
      status: b.status === 'CONFIRMED' ? 'active' : b.status === 'COMPLETED' ? 'completed' : 'cancelled',
      date: b.bookingDate ? new Date(b.bookingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      time: (b as any).timeSlot || b.slotId || '17:00 - 18:00',
      timestamp: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    };
    return sendResponse(res, 200, true, 'Booking retrieved successfully', result);
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /bookings/{id}:
 *   delete:
 *     summary: Cancel a booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       404:
 *         description: Booking not found or not owned by user
 */
router.delete('/:id', authenticate as any, async (req: any, res, next) => {
  try {
    const { reason } = req.body;
    const b = await bookingRepository.findById(req.params.id);
    if (!b || b.userId !== req.user.id) {
      throw new NotFoundError('Booking not found');
    }

    if (b.status === 'CANCELLED') {
      return sendResponse(res, 200, true, 'Booking was already cancelled');
    }

    // Enforce 3-hour cancellation limit
    const timeSlotStr = (b as any).timeSlot || b.slotId || '';
    const bookingDateVal = b.bookingDate;
    if (bookingDateVal && timeSlotStr) {
      const getSlotStartDateTime = (dateVal: Date | string, timeStr: string): Date | null => {
        try {
          const d = new Date(dateVal);
          if (isNaN(d.getTime())) return null;
          const startPart = timeStr.split('-')[0].trim();
          const [hPart, mPart] = startPart.split(':');
          const hr = parseInt(hPart, 10);
          const mn = parseInt(mPart || '0', 10);
          if (isNaN(hr)) return null;
          d.setHours(hr, mn, 0, 0);
          return d;
        } catch {
          return null;
        }
      };

      const startDateTime = getSlotStartDateTime(bookingDateVal, timeSlotStr);
      if (startDateTime) {
        const now = new Date();
        const diffHours = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours < 3) {
          return sendResponse(res, 400, false, 'Cancellations are only allowed at least 3 hours before the slot start time.');
        }
      }
    }

    // Mark booking as cancelled
    await bookingRepository.updateStatus(req.params.id, 'CANCELLED', reason);

    // Mark associated payment as refunded/failed (if exists)
    const payment = await paymentRepository.findByBookingId(req.params.id);
    if (payment && payment.status === 'PAID') {
      await paymentRepository.updateStatus(payment.id, 'REFUNDED');
    } else if (payment && payment.status === 'PENDING') {
      await paymentRepository.updateStatus(payment.id, 'FAILED');
    }

    return sendResponse(res, 200, true, 'Booking cancelled successfully');
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /bookings/{id}/reschedule:
 *   put:
 *     summary: Reschedule a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - time
 *             properties:
 *               date:
 *                 type: string
 *               time:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking rescheduled successfully
 *       400:
 *         description: Slot already booked or missing parameters
 *       404:
 *         description: Booking not found
 */
router.put('/:id/reschedule', authenticate as any, async (req: any, res, next) => {
  try {
    const { date, time } = req.body;
    if (!date || !time) {
      return sendResponse(res, 400, false, 'Date and time are required for rescheduling');
    }

    const b = await bookingRepository.findById(req.params.id);
    if (!b || b.userId !== req.user.id) {
      throw new NotFoundError('Booking not found');
    }

    if (b.status === 'CANCELLED') {
      return sendResponse(res, 400, false, 'Cannot reschedule a cancelled booking');
    }

    // Check if the selected slot is already booked on the target date
    const existingBookings = await bookingRepository.findByTurfId(b.turfId);
    const targetDateStr = new Date(date).toISOString().split('T')[0];
    
    const isBooked = existingBookings.some((eb) => {
      if (eb.id === b.id || eb.status === 'CANCELLED') return false;
      const ebDate = eb.bookingDate ? new Date(eb.bookingDate).toISOString().split('T')[0] : '';
      const ebTime = (eb as any).timeSlot || eb.slotId || '';
      
      // Split and match slots (since it can support comma-separated list of slots)
      const ebSlots = ebTime.split(',').map((s: string) => s.trim());
      const targetSlots = time.split(',').map((s: string) => s.trim());
      
      const hasOverlap = ebSlots.some((slot: string) => targetSlots.includes(slot));
      return ebDate === targetDateStr && hasOverlap;
    });

    if (isBooked) {
      return sendResponse(res, 400, false, 'The selected time slot is already booked on this date');
    }

    await bookingRepository.reschedule(req.params.id, date, time);
    return sendResponse(res, 200, true, 'Booking rescheduled successfully');
  } catch (error) {
    return next(error);
  }
});

export default router;
