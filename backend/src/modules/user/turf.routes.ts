import { Router } from 'express';
import { turfRepository, bookingRepository, userRepository } from '../../repositories/index.js';
import { sendResponse } from '../../shared/utils/response.js';
import { NotFoundError } from '../../shared/utils/errors.js';

const router = Router();

/**
 * @openapi
 * /turfs:
 *   get:
 *     summary: Retrieve list of all active turfs
 *     tags: [Turfs]
 *     responses:
 *       200:
 *         description: Turfs retrieved successfully
 */
router.get('/', async (req, res, next) => {
  try {
    const turfs = await turfRepository.findAllActive();
    return sendResponse(res, 200, true, 'Turfs retrieved successfully', turfs);
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /turfs/{id}:
 *   get:
 *     summary: Get turf details by ID
 *     tags: [Turfs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Turf details retrieved successfully
 */
router.get('/:id', async (req, res, next) => {
  try {
    const turf = await turfRepository.findById(req.params.id);
    if (!turf) {
      throw new NotFoundError('Turf not found');
    }

    const ownerProfile = await userRepository.getOwnerProfile(turf.ownerId);

    const responseData = {
      ...turf,
      ownerProfile: ownerProfile ? {
        companyName: ownerProfile.companyName,
        businessUpiId: ownerProfile.businessUpiId || 'merchant@upi',
        advancePaymentPercent: ownerProfile.advancePaymentPercent || 30,
        convenienceFee: ownerProfile.convenienceFee || 45,
        taxRate: ownerProfile.taxRate || 18,
        onlinePaymentsEnabled: ownerProfile.onlinePaymentsEnabled !== false,
      } : null
    };

    return sendResponse(res, 200, true, 'Turf details retrieved successfully', responseData);
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /turfs/{id}/bookings:
 *   get:
 *     summary: Retrieve active/pending bookings for a specific turf
 *     tags: [Turfs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active bookings retrieved successfully
 */
router.get('/:id/bookings', async (req, res, next) => {
  try {
    const bookings = await bookingRepository.findByTurfId(req.params.id);
    // Filter active or pending bookings to avoid double-booking
    const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING');
    return sendResponse(res, 200, true, 'Active turf bookings retrieved successfully', activeBookings);
  } catch (error) {
    return next(error);
  }
});

export default router;
