import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { authorizeRoles } from '../../middlewares/rbac.js';
import { validate } from '../../middlewares/validator.js';
import {
  ownerApprovalSchema,
  turfStatusSchema,
  sportSchema,
  amenitySchema,
  citySchema,
  areaSchema,
  couponSchema,
  planSchema,
  settingSchema,
} from './admin.validators.js';

const router = Router();

// Apply SUPER_ADMIN protection globally to all admin sub-routes
router.use(authenticate as any);
router.use(authorizeRoles('SUPER_ADMIN') as any);

/**
 * @openapi
 * /admin/dashboard:
 *   get:
 *     summary: Retrieve dashboard occupancy, bookings, and revenue metrics
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats successfully loaded
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * @openapi
 * /admin/logs:
 *   get:
 *     summary: Retrieve admin audit trail log logs
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit logs retrieved
 */
router.get('/logs', adminController.getAuditLogs);

// --- User Management ---
router.get('/users', adminController.getUsers);
router.put('/users/:id/block', adminController.blockUser);
router.put('/users/:id/unblock', adminController.unblockUser);
router.delete('/users/:id', adminController.deleteUser);

// --- Owner Management ---
router.get('/owners', adminController.getOwners);
router.put('/owners/:id/approve', adminController.approveOwner);
router.put('/owners/:id/reject', validate({ body: ownerApprovalSchema }), adminController.rejectOwner);
router.put('/owners/:id/payment', adminController.updateOwnerPayment);

// --- Turf Management ---
router.put('/turfs/:id/status', validate({ body: turfStatusSchema }), adminController.updateTurfStatus);

// --- Sports CRUD ---
router.get('/sports', adminController.getSports);
router.post('/sports', validate({ body: sportSchema }), adminController.createSport);
router.put('/sports/:id', validate({ body: sportSchema }), adminController.updateSport);
router.delete('/sports/:id', adminController.deleteSport);

// --- Amenities CRUD ---
router.get('/amenities', adminController.getAmenities);
router.post('/amenities', validate({ body: amenitySchema }), adminController.createAmenity);
router.put('/amenities/:id', validate({ body: amenitySchema }), adminController.updateAmenity);
router.delete('/amenities/:id', adminController.deleteAmenity);

// --- Cities CRUD ---
router.get('/cities', adminController.getCities);
router.post('/cities', validate({ body: citySchema }), adminController.createCity);
router.put('/cities/:id', validate({ body: citySchema }), adminController.updateCity);
router.delete('/cities/:id', adminController.deleteCity);
router.post('/cities/:id/areas', validate({ body: areaSchema }), adminController.createArea);

// --- Coupon CRUD ---
router.get('/coupons', adminController.getCoupons);
router.post('/coupons', validate({ body: couponSchema }), adminController.createCoupon);
router.put('/coupons/:id', validate({ body: couponSchema }), adminController.updateCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);

// --- Subscription Plans CRUD ---
router.get('/subscriptions', adminController.getPlans);
router.post('/subscriptions', validate({ body: planSchema }), adminController.createPlan);
router.put('/subscriptions/:id', validate({ body: planSchema }), adminController.updatePlan);
router.delete('/subscriptions/:id', adminController.deletePlan);

// --- Settings CRUD ---
router.get('/settings', adminController.getSettings);
router.put('/settings/:key', validate({ body: settingSchema }), adminController.updateSetting);

// --- Reports & Exports ---
router.get('/reports', adminController.getReports);

export default router;
