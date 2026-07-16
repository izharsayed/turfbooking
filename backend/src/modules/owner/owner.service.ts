import {
  ownerRepository,
  turfRepository,
  bookingRepository,
  paymentRepository,
  couponRepository,
  userRepository,
} from '../../repositories/index.js';
import { NotFoundError, ValidationError } from '../../shared/utils/errors.js';
import { emitSocketEvent } from '../../socket/index.js';
import bcrypt from 'bcryptjs';

export class OwnerService {
  // --- Dashboard & Analytics ---
  public async getDashboardStats(ownerId: string) {
    return ownerRepository.getDashboardStats(ownerId);
  }

  // --- Profile Management ---
  public async getProfile(ownerId: string) {
    const user = await userRepository.findById(ownerId);
    if (!user) throw new NotFoundError('Owner profile not found');
    const ownerProfile = await userRepository.getOwnerProfile(ownerId);
    // Razorpay was removed from the platform; strip any legacy stored
    // credentials so they never reach a client.
    let safeOwnerProfile = ownerProfile || null;
    if (safeOwnerProfile) {
      const { razorpayKeyId, razorpayKeySecret, ...rest } = safeOwnerProfile;
      safeOwnerProfile = rest;
    }
    return {
      user,
      ownerProfile: safeOwnerProfile
    };
  }

  public async updateProfile(ownerId: string, data: any) {
    const user = await userRepository.findById(ownerId);
    if (!user) throw new NotFoundError('Owner profile not found');

    const { name, phone, email, ...ownerProfileData } = data;

    // Razorpay was removed from the platform; never persist gateway credentials.
    delete ownerProfileData.razorpayKeyId;
    delete ownerProfileData.razorpayKeySecret;
    delete ownerProfileData.hasRazorpayKeySecret;

    if (name || phone || email) {
      const updates: any = {};
      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (email) updates.email = email;
      await userRepository.update(ownerId, updates);
    }

    if (Object.keys(ownerProfileData).length > 0) {
      await userRepository.updateOwnerProfile(ownerId, ownerProfileData);
    }

    return this.getProfile(ownerId);
  }

  // --- Turfs Management ---
  public async getTurfs(ownerId: string) {
    return ownerRepository.listTurfs(ownerId);
  }

  public async createTurf(ownerId: string, data: any) {
    const { address, latitude, longitude, cityId, areaId, ...rest } = data;
    return turfRepository.create({
      ...rest,
      location: {
        address: address || 'Ahmednagar',
        latitude: Number(latitude) || 19.0948,
        longitude: Number(longitude) || 74.7480,
        city: 'Ahmednagar',
      },
      ownerId,
      isActive: true,
    } as any);
  }

  public async updateTurf(ownerId: string, turfId: string, data: any) {
    const turf = await turfRepository.findById(turfId);
    if (!turf || turf.ownerId !== ownerId) {
      throw new NotFoundError('Turf not found or not owned by you');
    }
    return turfRepository.update(turfId, data);
  }

  public async deleteTurf(ownerId: string, turfId: string) {
    const turf = await turfRepository.findById(turfId);
    if (!turf || turf.ownerId !== ownerId) {
      throw new NotFoundError('Turf not found or not owned by you');
    }
    return turfRepository.update(turfId, { deletedAt: new Date(), isActive: false } as any);
  }

  // --- Booking & Offline Booking ---
  public async getBookings(ownerId: string) {
    return ownerRepository.listBookings(ownerId);
  }

  public async createOfflineBooking(ownerId: string, data: any) {
    // Determine slotId/timeSlot display string
    const startHour = new Date(data.startTime).getUTCHours();
    const endHour = new Date(data.endTime).getUTCHours();
    const slotId = `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;

    // (Offline bookings bypass real payment gateways)
    const booking = await bookingRepository.create({
      ...data,
      slotId,
      timeSlot: slotId,
      totalAmount: data.finalAmount,
      userId: ownerId, // Booked by owner
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'OFFLINE',
    });

    // Notify the owner channel in real-time
    emitSocketEvent(`owner_${ownerId}`, 'booking_created', {
      bookingId: booking.id,
      turfId: data.turfId,
      customerName: data.customerName,
      finalAmount: data.finalAmount,
    });

    return booking;
  }

  public async cancelBooking(ownerId: string, bookingId: string) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const turf = await turfRepository.findById(booking.turfId);
    if (!turf || turf.ownerId !== ownerId) {
      throw new ValidationError('Not authorized to cancel this booking');
    }

    const result = await bookingRepository.updateStatus(bookingId, 'CANCELLED');

    // Notify real-time socket channels
    emitSocketEvent(`owner_${ownerId}`, 'booking_cancelled', {
      bookingId,
      turfId: turf.id,
    });

    return result;
  }

  public async confirmBooking(ownerId: string, bookingId: string) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const turf = await turfRepository.findById(booking.turfId);
    if (!turf || turf.ownerId !== ownerId) {
      throw new ValidationError('Not authorized to confirm this booking');
    }

    const result = await bookingRepository.updateStatus(bookingId, 'CONFIRMED');

    const payment = await paymentRepository.findByBookingId(bookingId);
    if (payment) {
      await paymentRepository.updateStatus(payment.id, 'PAID');
    }

    // Notify real-time socket channels
    emitSocketEvent(`owner_${ownerId}`, 'booking_confirmed', {
      bookingId,
      turfId: turf.id,
    });

    return result;
  }

  // --- Payments ---
  public async getPayments(ownerId: string) {
    return ownerRepository.listPayments(ownerId);
  }

  // --- Reviews ---
  public async getReviews(ownerId: string) {
    return ownerRepository.listReviews(ownerId);
  }

  public async replyToReview(ownerId: string, reviewId: string, reply: string) {
    const reviews = await ownerRepository.listReviews(ownerId);
    if (!reviews.some((review: any) => review.id === reviewId)) {
      throw new NotFoundError('Review not found');
    }
    return ownerRepository.replyToReview(reviewId, reply);
  }

  // --- Coupons CRUD ---
  public async getCoupons(ownerId: string) {
    return (await couponRepository.findAll()).filter((coupon) => coupon.createdBy === ownerId);
  }

  public async createCoupon(ownerId: string, data: any) {
    return couponRepository.create({
      ...data,
      createdBy: ownerId,
    });
  }

  public async updateCoupon(ownerId: string, couponId: string, data: any) {
    const coupon = await couponRepository.findById(couponId);
    if (!coupon || coupon.createdBy !== ownerId) throw new NotFoundError('Coupon not found');
    return couponRepository.update(couponId, data);
  }

  public async deleteCoupon(ownerId: string, couponId: string) {
    const coupon = await couponRepository.findById(couponId);
    if (!coupon || coupon.createdBy !== ownerId) throw new NotFoundError('Coupon not found');
    return couponRepository.delete(couponId);
  }

  // --- Reports & Exports ---
  public async exportReport(ownerId: string, reportType: string, format: 'csv' | 'pdf') {
    const mockData = `id,date,turf,revenue\n1,2026-07-04,Pitch A,1200\n2,2026-07-04,Court B,800`;
    return {
      filename: `${reportType}_report_${Date.now()}.${format}`,
      contentType: format === 'csv' ? 'text/csv' : 'application/pdf',
      data: Buffer.from(mockData, 'utf-8'),
    };
  }

  // --- Employee Management ---
  public async getEmployees(ownerId: string) {
    return ownerRepository.listEmployees(ownerId);
  }
  public async createEmployee(ownerId: string, data: any) {
    let passwordHash = undefined;
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }
    return ownerRepository.createEmployee(ownerId, { ...data, passwordHash });
  }
  public async updateEmployee(ownerId: string, employeeId: string, data: any) {
    const employee = (await ownerRepository.listEmployees(ownerId)).find((item: any) => item.id === employeeId);
    if (!employee) throw new NotFoundError('Employee not found');
    const updateData = { ...data };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
      delete updateData.password;
    }
    return ownerRepository.updateEmployee(employeeId, updateData);
  }
  public async deleteEmployee(ownerId: string, employeeId: string) {
    const employee = (await ownerRepository.listEmployees(ownerId)).find((item: any) => item.id === employeeId);
    if (!employee) throw new NotFoundError('Employee not found');
    return ownerRepository.deleteEmployee(employeeId);
  }
}
export const ownerService = new OwnerService();
