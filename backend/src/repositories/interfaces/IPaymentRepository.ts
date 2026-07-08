import { Payment } from '../../shared/types/domain.js';

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByBookingId(bookingId: string): Promise<Payment | null>;
  create(paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment>;
  updateStatus(id: string, status: Payment['status'], extra?: { razorpayPaymentId?: string; razorpaySignature?: string }): Promise<Payment>;
}
