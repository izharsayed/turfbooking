import rateLimit from 'express-rate-limit';
import { sendResponse } from '../shared/utils/response.js';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    return sendResponse(
      res,
      429,
      false,
      'Too many requests from this IP, please try again after 15 minutes.'
    );
  },
});

export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendResponse(
      res,
      429,
      false,
      'Too many login attempts. Please try again after a minute.'
    );
  },
});

export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => sendResponse(res, 429, false, 'Too many registration attempts. Please try again later.'),
});

export const otpRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 OTP requests/verifications per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendResponse(
      res,
      429,
      false,
      'Too many OTP requests. Please try again after a minute.'
    );
  },
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendResponse(
      res,
      429,
      false,
      'Too many password reset requests. Please try again after an hour.'
    );
  },
});
