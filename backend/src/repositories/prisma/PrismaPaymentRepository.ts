import { Payment } from '../../shared/types/domain.js';
import { IPaymentRepository } from '../interfaces/IPaymentRepository.js';
import { prisma } from '../../database/index.js';

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
        razorpayOrderId: paymentData.razorpayOrderId,
        status: paymentData.status,
      },
    });
    return this.mapPayment(p);
  }

  public async updateStatus(
    id: string,
    status: Payment['status'],
    extra?: { razorpayPaymentId?: string; razorpaySignature?: string }
  ): Promise<Payment> {
    const data: any = { status };
    if (extra?.razorpayPaymentId) data.razorpayPaymentId = extra.razorpayPaymentId;
    if (extra?.razorpaySignature) data.razorpaySignature = extra.razorpaySignature;

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
      razorpayOrderId: p.razorpayOrderId,
      razorpayPaymentId: p.razorpayPaymentId || undefined,
      razorpaySignature: p.razorpaySignature || undefined,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}
