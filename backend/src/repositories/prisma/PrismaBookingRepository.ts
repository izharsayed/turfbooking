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
    bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> & { bookingDate?: Date | string }
  ): Promise<Booking> {
    const b = await prisma.booking.create({
      data: {
        userId: bookingData.userId,
        turfId: bookingData.turfId,
        slotId: bookingData.slotId,
        totalAmount: bookingData.totalAmount,
        status: bookingData.status,
        bookingDate: bookingData.bookingDate ? new Date(bookingData.bookingDate) : new Date(),
      },
    });
    return this.mapBooking(b);
  }

  public async updateStatus(id: string, status: Booking['status'], reason?: string): Promise<Booking> {
    const b = await prisma.booking.update({
      where: { id },
      data: {
        status,
        ...(reason ? { cancellationReason: reason } : {}),
      },
    });
    return this.mapBooking(b);
  }

  public async reschedule(id: string, date: Date | string, slotId: string): Promise<Booking> {
    const b = await prisma.booking.update({
      where: { id },
      data: {
        bookingDate: new Date(date),
        slotId: slotId,
      },
    });
    return this.mapBooking(b);
  }

  public async findAllPending(): Promise<Booking[]> {
    const bookings = await prisma.booking.findMany({ where: { status: 'PENDING' } });
    return bookings.map(this.mapBooking);
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
      timeSlot: b.timeSlot || b.time || b.slotId,
    } as any;
  }
}
