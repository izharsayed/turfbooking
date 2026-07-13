import { Booking } from '../../shared/types/domain.js';

export interface IBookingRepository {
  findById(id: string): Promise<Booking | null>;
  findByUserId(userId: string): Promise<Booking[]>;
  findByTurfId(turfId: string): Promise<Booking[]>;
  create(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> & { bookingDate?: Date | string }): Promise<Booking>;
  updateStatus(id: string, status: Booking['status'], reason?: string): Promise<Booking>;
  reschedule(id: string, date: Date | string, slotId: string): Promise<Booking>;
  findAllPending(): Promise<Booking[]>;
}
