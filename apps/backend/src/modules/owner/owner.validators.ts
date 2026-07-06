import { z } from 'zod';

export const createTurfSchema = z.object({
  name: z.string().min(1, 'Turf name is required'),
  description: z.string().min(1, 'Description is required'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.number(),
  longitude: z.number(),
  pricePerHour: z.number().positive(),
  cityId: z.string().uuid(),
  areaId: z.string().uuid(),
  sports: z.array(z.string().uuid()).min(1, 'At least one sport must be assigned'),
  amenities: z.array(z.string().uuid()).optional(),
});

export const updateTurfSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  pricePerHour: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const createSlotSchema = z.object({
  turfId: z.string().uuid(),
  startTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  price: z.number().positive(),
  dayOfWeek: z.number().int().min(0).max(6),
});

export const blockSlotSchema = z.object({
  turfId: z.string().uuid(),
  date: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  reason: z.string().min(1, 'Reason is required'),
});

export const manualBookingSchema = z.object({
  turfId: z.string().uuid(),
  sportId: z.string().uuid(),
  date: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(10).max(15),
  finalAmount: z.number().positive(),
});

export const reviewReplySchema = z.object({
  reply: z.string().min(1, 'Reply message is required'),
});
