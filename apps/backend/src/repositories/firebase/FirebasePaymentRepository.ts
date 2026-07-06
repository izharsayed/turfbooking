import { Payment } from '@turf-booking/types';
import { IPaymentRepository } from '../interfaces/IPaymentRepository.js';
import { firestoreDb } from '../../config/firebase.js';

export class FirebasePaymentRepository implements IPaymentRepository {
  private get collection() {
    if (!firestoreDb) {
      throw new Error('Firestore Database is not initialized.');
    }
    return firestoreDb.collection('payments');
  }

  public async findById(id: string): Promise<Payment | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapPayment(doc.id, doc.data());
  }

  public async findByBookingId(bookingId: string): Promise<Payment | null> {
    const snap = await this.collection.where('bookingId', '==', bookingId).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return this.mapPayment(doc.id, doc.data());
  }

  public async create(paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    const docRef = this.collection.doc();
    const newPayment = {
      bookingId: paymentData.bookingId,
      userId: paymentData.userId,
      amount: paymentData.amount,
      razorpayOrderId: paymentData.razorpayOrderId,
      razorpayPaymentId: paymentData.razorpayPaymentId || null,
      razorpaySignature: paymentData.razorpaySignature || null,
      status: paymentData.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await docRef.set(newPayment);
    return this.mapPayment(docRef.id, newPayment);
  }

  public async updateStatus(
    id: string,
    status: Payment['status'],
    extra?: { razorpayPaymentId?: string; razorpaySignature?: string }
  ): Promise<Payment> {
    const docRef = this.collection.doc(id);
    const updateData: any = { status, updatedAt: new Date() };
    if (extra?.razorpayPaymentId) updateData.razorpayPaymentId = extra.razorpayPaymentId;
    if (extra?.razorpaySignature) updateData.razorpaySignature = extra.razorpaySignature;

    await docRef.update(updateData);
    const doc = await docRef.get();
    return this.mapPayment(id, doc.data());
  }

  private mapPayment(id: string, data: any): Payment {
    return {
      id,
      bookingId: data.bookingId,
      userId: data.userId,
      amount: data.amount,
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId || undefined,
      razorpaySignature: data.razorpaySignature || undefined,
      status: data.status,
      createdAt: data.createdAt instanceof Date ? data.createdAt : data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt?.toDate?.() || new Date(),
    };
  }
}
