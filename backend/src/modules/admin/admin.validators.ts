import { z } from 'zod';

export const ownerApprovalSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

export const turfStatusSchema = z.object({
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const sportSchema = z.object({
  name: z.string().min(1, 'Sport name is required'),
  slug: z.string().min(1, 'Sport slug is required'),
  description: z.string().optional(),
});

export const amenitySchema = z.object({
  name: z.string().min(1, 'Amenity name is required'),
  iconUrl: z.string().optional(),
  description: z.string().optional(),
});

export const citySchema = z.object({
  name: z.string().min(1, 'City name is required'),
  slug: z.string().min(1, 'City slug is required'),
  state: z.string().min(1, 'State name is required'),
});

export const areaSchema = z.object({
  name: z.string().min(1, 'Area name is required'),
  slug: z.string().min(1, 'Area slug is required'),
  zipcode: z.string().min(6, 'Pincode must be at least 6 digits'),
});

export const couponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  description: z.string().optional(),
  discountType: z.enum(['FLAT', 'PERCENTAGE']),
  value: z.number().positive(),
  minBookingAmount: z.number().nonnegative().default(0),
  maxDiscount: z.number().nonnegative().default(0),
  usageLimit: z.number().int().positive().default(1),
  perUserLimit: z.number().int().positive().default(1),
  expiryDate: z.string().datetime(),
  isActive: z.boolean().default(true),
});

export const planSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().nonnegative(),
  durationDays: z.number().int().positive(),
  maxTurfs: z.number().int().positive(),
  isActive: z.boolean().default(true),
  features: z.array(z.string()).optional(),
});

export const settingSchema = z.object({
  value: z.string().min(1, 'Setting value is required'),
  description: z.string().optional(),
});
