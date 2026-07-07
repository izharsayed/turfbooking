import { IOwnerRepository } from '../interfaces/IOwnerRepository.js';
import { firestoreDb } from '../../config/firebase.js';

export class FirebaseOwnerRepository implements IOwnerRepository {
  public async getDashboardStats(ownerId: string): Promise<any> {
    if (!firestoreDb) return {};

    const [
      totalTurfsSnap,
      activeTurfsSnap,
      bookingsSnap,
    ] = await Promise.all([
      firestoreDb.collection('turfs').where('ownerId', '==', ownerId).get(),
      firestoreDb.collection('turfs').where('ownerId', '==', ownerId).where('isActive', '==', true).get(),
      firestoreDb.collection('bookings').get(), // To filter bookings by turf owner in memory
    ]);

    const totalTurfs = totalTurfsSnap.size;
    const activeTurfs = activeTurfsSnap.size;

    // Filter bookings belonging to owner's turfs
    const ownerTurfIds = new Set(totalTurfsSnap.docs.map((doc) => doc.id));
    let todaysBookingsCount = 0;
    let totalRevenue = 0;

    bookingsSnap.forEach((doc) => {
      const data = doc.data();
      if (ownerTurfIds.has(data.turfId)) {
        if (data.paymentStatus === 'PAID') {
          totalRevenue += data.finalAmount || 0;
        }
        const createdDate = data.createdAt?.toDate?.() || new Date();
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        if (createdDate.getTime() >= startOfToday) {
          todaysBookingsCount++;
        }
      }
    });

    return {
      todayBookings: todaysBookingsCount,
      upcomingBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      todayRevenue: 0,
      weeklyRevenue: 0,
      monthlyRevenue: totalRevenue,
      totalRevenue,
      occupancyRate: 0.0,
      mostBookedTurf: null,
      peakBookingHours: [],
      recentCustomers: [],
      recentReviews: [],
      averageRating: 0.0,
      pendingPayments: 0,
      refundRequests: 0,
    };
  }

  public async listTurfs(ownerId: string): Promise<any[]> {
    if (!firestoreDb) return [];
    const snap = await firestoreDb.collection('turfs').where('ownerId', '==', ownerId).get();
    const list: any[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (!data.deletedAt) {
        list.push({ id: doc.id, ...data });
      }
    });
    return list;
  }

  public async listBookings(ownerId: string): Promise<any[]> {
    if (!firestoreDb) return [];
    const turfs = await this.listTurfs(ownerId);
    const turfIds = turfs.map((t) => t.id);

    if (turfIds.length === 0) return [];

    const snap = await firestoreDb.collection('bookings').get();
    const list: any[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (turfIds.includes(data.turfId) && !data.deletedAt) {
        list.push({ id: doc.id, ...data });
      }
    });
    return list;
  }

  public async listPayments(ownerId: string): Promise<any[]> {
    if (!firestoreDb) return [];
    const bookings = await this.listBookings(ownerId);
    const bookingIds = bookings.map((b) => b.id);

    if (bookingIds.length === 0) return [];

    const snap = await firestoreDb.collection('payments').get();
    const list: any[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (bookingIds.includes(data.bookingId) && !data.deletedAt) {
        list.push({ id: doc.id, ...data });
      }
    });
    return list;
  }

  public async listReviews(ownerId: string): Promise<any[]> {
    if (!firestoreDb) return [];
    const snap = await firestoreDb.collection('reviews').get();
    const list: any[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      list.push({ id: doc.id, ...data });
    });
    return list;
  }

  public async replyToReview(reviewId: string, reply: string): Promise<any> {
    if (!firestoreDb) return null;
    const docRef = firestoreDb.collection('reviews').doc(reviewId);
    await docRef.update({ ownerReply: reply, updatedAt: new Date() });
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  }
}
