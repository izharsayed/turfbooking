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

// Apply TURF_OWNER and CARETAKER protection globally to owner sub-routes
router.use(authenticate as any);
router.use(authorizeRoles('TURF_OWNER', 'CARETAKER') as any);

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

// --- Turf Management (Read for all, Write for Owner only) ---
router.get('/turfs', ownerController.getTurfs);
router.post('/turfs', authorizeRoles('TURF_OWNER') as any, validate({ body: createTurfSchema }), ownerController.createTurf);
router.put('/turfs/:id', authorizeRoles('TURF_OWNER') as any, validate({ body: updateTurfSchema }), ownerController.updateTurf);
router.delete('/turfs/:id', authorizeRoles('TURF_OWNER') as any, ownerController.deleteTurf);

// --- Bookings ---
router.get('/bookings', ownerController.getBookings);
router.post('/bookings/offline', validate({ body: manualBookingSchema }), ownerController.createOfflineBooking);
router.put('/bookings/:id/cancel', ownerController.cancelBooking);
router.put('/bookings/:id/confirm', ownerController.confirmBooking);

// --- Payments (Owner only) ---
router.get('/payments', authorizeRoles('TURF_OWNER') as any, ownerController.getPayments);

// --- Reviews ---
router.get('/reviews', ownerController.getReviews);
router.post('/reviews/:id/reply', validate({ body: reviewReplySchema }), ownerController.replyToReview);

// --- Coupons (Owner only) ---
router.get('/coupons', authorizeRoles('TURF_OWNER') as any, ownerController.getCoupons);
router.post('/coupons', authorizeRoles('TURF_OWNER') as any, ownerController.createCoupon);
router.put('/coupons/:id', authorizeRoles('TURF_OWNER') as any, ownerController.updateCoupon);
router.delete('/coupons/:id', authorizeRoles('TURF_OWNER') as any, ownerController.deleteCoupon);

// --- Reports (Owner only) ---
router.get('/reports', authorizeRoles('TURF_OWNER') as any, ownerController.getReports);

// --- Employees (Owner only) ---
router.get('/employees', authorizeRoles('TURF_OWNER') as any, ownerController.getEmployees);
router.post('/employees', authorizeRoles('TURF_OWNER') as any, ownerController.createEmployee);
router.put('/employees/:id', authorizeRoles('TURF_OWNER') as any, ownerController.updateEmployee);
router.delete('/employees/:id', authorizeRoles('TURF_OWNER') as any, ownerController.deleteEmployee);

export default router;
