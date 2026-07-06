export type UserRole = 'SUPER_ADMIN' | 'TURF_OWNER' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Turf {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
    city: string;
  };
  images: string[];
  amenities: string[];
  sports: string[];
  pricePerHour: number;
  rating: number;
  numReviews: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';

export interface Slot {
  id: string;
  turfId: string;
  startTime: Date;
  endTime: Date;
  price: number;
  status: SlotStatus;
  createdAt: Date;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  userId: string;
  turfId: string;
  slotId: string;
  bookingDate: Date;
  totalAmount: number;
  status: BookingStatus;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  turfId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'PAYMENT_FAILED' | 'GENERAL';
  createdAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  maxDiscount: number;
  minBookingAmount: number;
  expiryDate: Date;
  isActive: boolean;
}
