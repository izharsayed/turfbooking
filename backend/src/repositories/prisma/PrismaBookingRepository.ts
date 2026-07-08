import { Booking } from '../../shared/types/domain.js';
import { IBookingRepository } from '../interfaces/IBookingRepository.js';
import { prisma } from '../../database/index.js';

export class PrismaBookingRepository implements IBookingRepository {
  public async findById(id: string): Promise<Booking | null> {
    const b = await prisma.booking.findUnique({ where: { id } });
    if (!b) return null;
    return this.mapBooking(b);
  }

  public async findByUserId(userId: string): Promise<Booking[]> {
    const bookings = await prisma.booking.findMany({ where: { userId } });
    return bookings.map(this.mapBooking);
  }

  public async findByTurfId(turfId: string): Promise<Booking[]> {
    const bookings = await prisma.booking.findMany({ where: { turfId } });
    return bookings.map(this.mapBooking);
  }

  public async create(
    bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'bookingDate'>
  ): Promise<Booking> {
    const b = await prisma.booking.create({
      data: {
        userId: bookingData.userId,
        turfId: bookingData.turfId,
        slotId: bookingData.slotId,
        totalAmount: bookingData.totalAmount,
        status: bookingData.status,
      },
    });
    return this.mapBooking(b);
  }

  public async updateStatus(id: string, status: Booking['status']): Promise<Booking> {
    const b = await prisma.booking.update({
      where: { id },
      data: { status },
    });
    return this.mapBooking(b);
  }

  private mapBooking(b: any): Booking {
    return {
      id: b.id,
      userId: b.userId,
      turfId: b.turfId,
      slotId: b.slotId,
      bookingDate: b.bookingDate,
      totalAmount: b.totalAmount,
      status: b.status,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  }
}
