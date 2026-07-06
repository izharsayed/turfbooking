import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env.js';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  jti?: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m', // Access token expires in 15 minutes
  });
}

export function generateRefreshToken(payload: TokenPayload, jti: string): string {
  return jwt.sign({ ...payload, jti }, env.JWT_REFRESH_SECRET, {
    expiresIn: (env.JWT_EXPIRE || '7d') as any, // Refresh token expires in 7 days
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}

export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateNumericOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
}
