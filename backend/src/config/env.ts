import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Known test secrets must never become the development default. An omitted
// NODE_ENV is common in deployments and would otherwise make JWTs forgeable.
if (process.env.NODE_ENV === 'test') {
  process.env.DATABASE_URL = process.env.DATABASE_URL || (process.env.DATABASE_PROVIDER === 'firebase' ? 'firebase' : 'postgresql://postgres:postgres@localhost:5432/turf_booking?schema=public');
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret_key_12345';
}

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_PROVIDER: z.enum(['prisma', 'firebase']).default('prisma'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_EXPIRE: z.string().default('7d'),
  REDIS_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.DATABASE_PROVIDER === 'prisma' && !data.DATABASE_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'DATABASE_URL is required when DATABASE_PROVIDER is prisma',
      path: ['DATABASE_URL'],
    });
  }
  if (data.DATABASE_PROVIDER === 'firebase') {
    if (!data.FIREBASE_PROJECT_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FIREBASE_PROJECT_ID is required when DATABASE_PROVIDER is firebase',
        path: ['FIREBASE_PROJECT_ID'],
      });
    }
    if (!data.FIREBASE_CLIENT_EMAIL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FIREBASE_CLIENT_EMAIL is required when DATABASE_PROVIDER is firebase',
        path: ['FIREBASE_CLIENT_EMAIL'],
      });
    }
    if (!data.FIREBASE_PRIVATE_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FIREBASE_PRIVATE_KEY is required when DATABASE_PROVIDER is firebase',
        path: ['FIREBASE_PRIVATE_KEY'],
      });
    }
  }
  if (data.NODE_ENV === 'production') {
    if (!data.JWT_SECRET || data.JWT_SECRET === 'test_jwt_secret_key_12345') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A secure unique JWT_SECRET must be set in production',
        path: ['JWT_SECRET'],
      });
    }
    if (!data.JWT_REFRESH_SECRET || data.JWT_REFRESH_SECRET === 'test_jwt_refresh_secret_key_12345') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A secure unique JWT_REFRESH_SECRET must be set in production',
        path: ['JWT_REFRESH_SECRET'],
      });
    }
    if (data.DATABASE_PROVIDER === 'prisma' && data.DATABASE_URL) {
      const urlLower = data.DATABASE_URL.toLowerCase();
      if (!urlLower.includes('sslmode=') && !urlLower.includes('ssl=true')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DATABASE_URL must enforce TLS/SSL in production (e.g. sslmode=require or ssl=true)',
          path: ['DATABASE_URL'],
        });
      }
      if (urlLower.includes('localhost') || urlLower.includes('127.0.0.1')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DATABASE_URL points to localhost, which is typically invalid for production environments',
          path: ['DATABASE_URL'],
        });
      }
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
