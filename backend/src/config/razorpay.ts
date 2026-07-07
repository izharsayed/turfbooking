import Razorpay from 'razorpay';
import { env } from './env.js';
import { logger } from './logger.js';

const getRazorpayInstance = () => {
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    logger.warn('⚠️ Razorpay keys are missing from environment variables. Payment operations will fail.');
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

export const razorpayClient = getRazorpayInstance();
export const razorpayKeySecret = env.RAZORPAY_KEY_SECRET;
export const razorpayKeyId = env.RAZORPAY_KEY_ID;
