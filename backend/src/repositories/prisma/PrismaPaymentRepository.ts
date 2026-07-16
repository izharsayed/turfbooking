import { Payment } from '../../shared/types/domain.js';
import { IPaymentRepository } from '../interfaces/IPaymentRepository.js';
import { prisma } from '../../database/index.js';

// Note: the underlying DB columns retain their legacy `razorpay*` names to avoid
// a data migration; the domain model exposes gateway-neutral names.
export class PrismaPaymentRepository implements IPaymentRepository {
  public async findById(id: string): Promise<Payment | null> {
    const p = await prisma.payment.findUnique({ where: { id } });
    if (!p) return null;
    return this.mapPayment(p);
  }

  public async findByBookingId(bookingId: string): Promise<Payment | null> {
    const p = await prisma.payment.findUnique({ where: { bookingId } });
    if (!p) return null;
    return this.mapPayment(p);
  }

  public async create(paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    const p = await prisma.payment.create({
      data: {
        bookingId: paymentData.bookingId,
        userId: paymentData.userId,
        amount: paymentData.amount,
        razorpayOrderId: paymentData.orderId,
        status: paymentData.status,
      },
    });
    return this.mapPayment(p);
  }

  public async updateStatus(
    id: string,
    status: Payment['status'],
    extra?: { transactionId?: string }
  ): Promise<Payment> {
    const data: any = { status };
    if (extra?.transactionId) data.razorpayPaymentId = extra.transactionId;

    const p = await prisma.payment.update({
      where: { id },
      data,
    });
    return this.mapPayment(p);
  }

  private mapPayment(p: any): Payment {
    return {
      id: p.id,
      bookingId: p.bookingId,
      userId: p.userId,
      amount: p.amount,
      orderId: p.razorpayOrderId,
      transactionId: p.razorpayPaymentId || undefined,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}
