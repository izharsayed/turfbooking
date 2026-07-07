import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(15),
  password: passwordSchema,
  avatarUrl: z.string().url().optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
});

export const registerOwnerSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(15),
  password: passwordSchema,
  companyName: z.string().min(1, 'Business name is required'),
  businessRegisterNumber: z.string().min(1, 'Business registration number is required'),
  businessAddress: z.string().min(1, 'Business address is required'),
  billingEmail: z.string().email('Invalid billing email'),
  avatarUrl: z.string().url().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const sendOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  code: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, 'Firebase ID Token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().datetime().optional().or(z.date().optional()),
  address: z.string().optional(),
});
