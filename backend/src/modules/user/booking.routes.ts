import { Router } from 'express';
import { bookingRepository, turfRepository, paymentRepository } from '../../repositories/index.js';
import { sendResponse } from '../../shared/utils/response.js';
import { authenticate } from '../../middlewares/auth.js';
import { NotFoundError } from '../../shared/utils/errors.js';
import Razorpay from 'razorpay';
import { env } from '../../config/env.js';
import crypto from 'crypto';

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
          time: b.slotId || '17:00 - 18:00',
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
    
    // 1. Create booking in PENDING status (requires payment verification)
    const booking = await bookingRepository.create({
      userId: req.user.id,
      turfId,
      slotId: slotId || time || '17:00 - 18:00',
      totalAmount: totalAmount || amount,
      status: 'PENDING',
      bookingDate: date || bookingDate || new Date(),
    });

    // 2. Generate Razorpay Order ID (real or mock dev fallback)
    let razorpayOrderId = `order_mock_${Math.random().toString(36).substring(2, 15)}`;
    
    if (razorpay) {
      try {
        const order = await razorpay.orders.create({
          amount: Math.round(amount * 100), // in paise
          currency: 'INR',
          receipt: booking.id,
        });
        razorpayOrderId = order.id;
      } catch (err) {
        console.error('Failed to create Razorpay order, using mock ID instead', err);
      }
    }

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

    // Verify signature if using real Razorpay
    if (razorpay && razorpaySignature) {
      try {
        const hmac = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET!);
        hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
        const generatedSignature = hmac.digest('hex');
        if (generatedSignature !== razorpaySignature) {
          await bookingRepository.updateStatus(bookingId, 'CANCELLED');
          await paymentRepository.updateStatus(payment.id, 'FAILED');
          return sendResponse(res, 400, false, 'Signature verification failed. Payment invalid.');
        }
      } catch (err) {
        console.error('Signature verification error', err);
        return sendResponse(res, 500, false, 'Error verifying signature');
      }
    }

    // Payment Successful -> Update states to CONFIRMED / PAID
    await bookingRepository.updateStatus(bookingId, 'CONFIRMED');
    await paymentRepository.updateStatus(payment.id, 'PAID', {
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || 'mock-signature',
    });

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
      time: b.slotId || '17:00 - 18:00',
      timestamp: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    };
    return sendResponse(res, 200, true, 'Booking retrieved successfully', result);
  } catch (error) {
    return next(error);
  }
});

export default router;
