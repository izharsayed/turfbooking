import { Router } from 'express';
import { userController } from './user.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validator.js';
import { upload } from '../../middlewares/upload.js';
import { updateProfileSchema } from '../auth/auth.validators.js';

const router = Router();

/**
 * @openapi
 * /profile:
 *   get:
 *     summary: Retrieve active user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/', authenticate as any, userController.getProfile as any);

/**
 * @openapi
 * /profile:
 *   put:
 *     summary: Update profile details
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfile'
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/', authenticate as any, validate({ body: updateProfileSchema }), userController.updateProfile as any);

/**
 * @openapi
 * /profile/avatar:
 *   put:
 *     summary: Upload profile avatar (JPEG, PNG, WebP max 5MB)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded
 */
router.put('/avatar', authenticate as any, upload.single('avatar'), userController.uploadAvatar as any);

/**
 * @openapi
 * /profile/avatar:
 *   delete:
 *     summary: Delete profile avatar
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted
 */
router.delete('/avatar', authenticate as any, userController.deleteAvatar as any);

/**
 * @openapi
 * /profile/account:
 *   delete:
 *     summary: Permanently delete your account (GDPR Art. 17 — Right to Erasure)
 *     description: Anonymizes all personal data (email, phone, name) and soft-deletes the account. This action is irreversible.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account successfully deleted and all personal data anonymized
 */
router.delete('/account', authenticate as any, userController.deleteAccount as any);

export default router;
