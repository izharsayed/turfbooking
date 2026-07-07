import { Router } from 'express';
import { ownerController } from './owner.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { authorizeRoles } from '../../middlewares/rbac.js';
import { validate } from '../../middlewares/validator.js';
import {
  createTurfSchema,
  updateTurfSchema,
  createSlotSchema,
  blockSlotSchema,
  manualBookingSchema,
  reviewReplySchema,
} from './owner.validators.js';

const router = Router();

// Apply TURF_OWNER protection globally to all owner sub-routes
router.use(authenticate as any);
router.use(authorizeRoles('TURF_OWNER') as any);

/**
 * @openapi
 * /owner/dashboard:
 *   get:
 *     summary: Retrieve owner dashboard stats
 *     tags: [Turf Owner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats successfully loaded
 */
router.get('/dashboard', ownerController.getDashboard);

// --- Owner Profile ---
router.get('/profile', ownerController.getProfile);
router.put('/profile', ownerController.updateProfile);

// --- Turf Management ---
router.get('/turfs', ownerController.getTurfs);
router.post('/turfs', validate({ body: createTurfSchema }), ownerController.createTurf);
router.put('/turfs/:id', validate({ body: updateTurfSchema }), ownerController.updateTurf);
router.delete('/turfs/:id', ownerController.deleteTurf);

// --- Bookings ---
router.get('/bookings', ownerController.getBookings);
router.post('/bookings/offline', validate({ body: manualBookingSchema }), ownerController.createOfflineBooking);
router.put('/bookings/:id/cancel', ownerController.cancelBooking);

// --- Payments ---
router.get('/payments', ownerController.getPayments);

// --- Reviews ---
router.get('/reviews', ownerController.getReviews);
router.post('/reviews/:id/reply', validate({ body: reviewReplySchema }), ownerController.replyToReview);

// --- Coupons ---
router.get('/coupons', ownerController.getCoupons);
router.post('/coupons', ownerController.createCoupon);
router.put('/coupons/:id', ownerController.updateCoupon);
router.delete('/coupons/:id', ownerController.deleteCoupon);

// --- Reports ---
router.get('/reports', ownerController.getReports);

export default router;
