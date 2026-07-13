import { Booking } from '../../shared/types/domain.js';
import { IBookingRepository } from '../interfaces/IBookingRepository.js';
import { firestoreDb } from '../../config/firebase.js';

export class FirebaseBookingRepository implements IBookingRepository {
  private get collection() {
    if (!firestoreDb) {
      throw new Error('Firestore Database is not initialized.');
    }
    return firestoreDb.collection('bookings');
  }

  public async findById(id: string): Promise<Booking | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapBooking(doc.id, doc.data());
  }

  public async findByUserId(userId: string): Promise<Booking[]> {
    const snap = await this.collection.where('userId', '==', userId).get();
    return snap.docs.map((doc) => this.mapBooking(doc.id, doc.data()));
  }

  public async findByTurfId(turfId: string): Promise<Booking[]> {
    const snap = await this.collection.where('turfId', '==', turfId).get();
    return snap.docs.map((doc) => this.mapBooking(doc.id, doc.data()));
  }

  public async create(
    bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> & { bookingDate?: Date | string }
  ): Promise<Booking> {
    const docRef = this.collection.doc();
    const newBooking: any = {
      ...bookingData,
      slotId: bookingData.slotId || '',
      totalAmount: bookingData.totalAmount || 0,
      bookingDate: bookingData.bookingDate ? new Date(bookingData.bookingDate) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Clean undefined values to prevent Firestore crashes
    Object.keys(newBooking).forEach((key) => {
      if (newBooking[key] === undefined) {
        delete newBooking[key];
      }
    });

    await docRef.set(newBooking);
    return this.mapBooking(docRef.id, newBooking);
  }

  public async updateStatus(id: string, status: Booking['status'], reason?: string): Promise<Booking> {
    const docRef = this.collection.doc(id);
    const updateData: any = { status, updatedAt: new Date() };
    if (reason) {
      updateData.cancellationReason = reason;
    }
    await docRef.update(updateData);
    const doc = await docRef.get();
    return this.mapBooking(id, doc.data());
  }

  public async reschedule(id: string, date: Date | string, slotId: string): Promise<Booking> {
    const docRef = this.collection.doc(id);
    await docRef.update({
      bookingDate: new Date(date),
      slotId: slotId,
      updatedAt: new Date(),
    });
    const doc = await docRef.get();
    return this.mapBooking(id, doc.data());
  }

  public async findAllPending(): Promise<Booking[]> {
    const snap = await this.collection.where('status', '==', 'PENDING').get();
    return snap.docs.map((doc) => this.mapBooking(doc.id, doc.data()));
  }

  private mapBooking(id: string, data: any): Booking {
    return {
      id,
      userId: data.userId,
      turfId: data.turfId,
      slotId: data.slotId,
      bookingDate: data.bookingDate 
        ? (data.bookingDate instanceof Date ? data.bookingDate : data.bookingDate?.toDate?.() || new Date(data.bookingDate))
        : (data.date ? new Date(data.date) : new Date()),
      totalAmount: data.totalAmount,
      status: data.status,
      createdAt: data.createdAt instanceof Date ? data.createdAt : data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt?.toDate?.() || new Date(),
      timeSlot: data.timeSlot || data.time || data.slotId,
    } as any;
  }
}
