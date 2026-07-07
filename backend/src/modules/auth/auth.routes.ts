import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validator.js';
import { authRateLimiter } from '../../middlewares/rateLimiter.js';
import {
  registerCustomerSchema,
  registerOwnerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.validators.js';

const router = Router();
const controller = new AuthController();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new customer account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterCustomer'
 *     responses:
 *       201:
 *         description: Registered successfully
 */
router.post('/register', validate({ body: registerCustomerSchema }), controller.registerCustomer);

/**
 * @openapi
 * /auth/register-owner:
 *   post:
 *     summary: Register a new turf owner account (pending approval)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterOwner'
 *     responses:
 *       201:
 *         description: Registered successfully (Pending verification)
 */
router.post('/register-owner', validate({ body: registerOwnerSchema }), controller.registerOwner);

/**
 * @openapi
 * /auth/verify:
 *   get:
 *     summary: Verify email verification link token
 *     tags: [Authentication]
 *     parameters:
 *       - name: token
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 */
router.get('/verify', controller.verifyEmail);

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verification resent
 */
router.post('/resend-verification', controller.resendVerification);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login via email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authRateLimiter, validate({ body: loginSchema }), controller.login);

/**
 * @openapi
 * /auth/send-otp:
 *   post:
 *     summary: Request numeric SMS OTP (mock/firebase)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendOtp'
 *     responses:
 *       200:
 *         description: OTP dispatched
 */
router.post('/send-otp', validate({ body: sendOtpSchema }), controller.sendOtp);

/**
 * @openapi
 * /auth/verify-otp:
 *   post:
 *     summary: Verify numeric SMS OTP and issue session
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtp'
 *     responses:
 *       200:
 *         description: Verified successfully
 */
router.post('/verify-otp', validate({ body: verifyOtpSchema }), controller.verifyOtp);

/**
 * @openapi
 * /auth/google:
 *   post:
 *     summary: Google sign-in using Firebase ID token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleLogin'
 *     responses:
 *       200:
 *         description: Authenticated successfully
 */
router.post('/google', validate({ body: googleLoginSchema }), controller.googleLogin);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Rotate refresh token session
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session rotated successfully
 */
router.post('/refresh', controller.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Terminate session on current device
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', authenticate as any, controller.logout as any);

/**
 * @openapi
 * /auth/logout-all:
 *   post:
 *     summary: Terminate all sessions across all devices
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out all
 */
router.post('/logout-all', authenticate as any, controller.logoutAll as any);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset link email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPassword'
 *     responses:
 *       200:
 *         description: Email dispatched
 */
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), controller.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using verification token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPassword'
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post('/reset-password', validate({ body: resetPasswordSchema }), controller.resetPassword);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Update password (authenticated session)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePassword'
 *     responses:
 *       200:
 *         description: Password changed
 */
router.post('/change-password', authenticate as any, validate({ body: changePasswordSchema }), controller.changePassword as any);

export default router;
