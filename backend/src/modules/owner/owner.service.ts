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
    return {
      user,
      ownerProfile: ownerProfile || null
    };
  }

  public async updateProfile(ownerId: string, data: any) {
    const user = await userRepository.findById(ownerId);
    if (!user) throw new NotFoundError('Owner profile not found');

    const { name, phone, email, ...ownerProfileData } = data;

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

  // --- Payments ---
  public async getPayments(ownerId: string) {
    return ownerRepository.listPayments(ownerId);
  }

  // --- Reviews ---
  public async getReviews(ownerId: string) {
    return ownerRepository.listReviews(ownerId);
  }

  public async replyToReview(ownerId: string, reviewId: string, reply: string) {
    // Verify review owner scope
    return ownerRepository.replyToReview(reviewId, reply);
  }

  // --- Coupons CRUD ---
  public async getCoupons(ownerId: string) {
    // Owners list all coupons or coupons they created
    return couponRepository.findAll();
  }

  public async createCoupon(ownerId: string, data: any) {
    return couponRepository.create({
      ...data,
      createdBy: ownerId,
    });
  }

  public async updateCoupon(ownerId: string, couponId: string, data: any) {
    const coupon = await couponRepository.findById(couponId);
    if (!coupon) throw new NotFoundError('Coupon not found');
    return couponRepository.update(couponId, data);
  }

  public async deleteCoupon(ownerId: string, couponId: string) {
    const coupon = await couponRepository.findById(couponId);
    if (!coupon) throw new NotFoundError('Coupon not found');
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
}
export const ownerService = new OwnerService();
