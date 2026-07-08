import { Router } from 'express';
import { bookingRepository, turfRepository } from '../../repositories/index.js';
import { sendResponse } from '../../shared/utils/response.js';
import { authenticate } from '../../middlewares/auth.js';
import { NotFoundError } from '../../shared/utils/errors.js';

const router = Router();

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
    const { turfId, slotId, amount, time } = req.body;
    
    const booking = await bookingRepository.create({
      userId: req.user.id,
      turfId,
      slotId: slotId || time || '17:00 - 18:00',
      totalAmount: amount,
      status: 'CONFIRMED',
    });

    return sendResponse(res, 201, true, 'Booking created successfully', booking);
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
