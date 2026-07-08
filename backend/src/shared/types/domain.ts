export type UserRole = 'SUPER_ADMIN' | 'TURF_OWNER' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface TurfLocation {
  address: string;
  latitude: number;
  longitude: number;
  city: string;
}

export interface Turf {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  location: TurfLocation;
  images: string[];
  amenities: string[];
  sports: string[];
  pricePerHour: number;
  rating: number;
  numReviews: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'NO_SHOW';

export interface Booking {
  id: string;
  userId: string;
  turfId: string;
  slotId?: string;
  bookingDate: Date;
  totalAmount: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}
