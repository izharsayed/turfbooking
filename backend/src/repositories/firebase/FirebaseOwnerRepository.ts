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
    let todaysRevenue = 0;
    let totalRevenue = 0;

    bookingsSnap.forEach((doc) => {
      const data = doc.data();
      if (ownerTurfIds.has(data.turfId)) {
        const isPaid = data.paymentStatus === 'PAID' || data.status === 'CONFIRMED' || data.status === 'COMPLETED';
        const amount = data.totalAmount || data.finalAmount || 0;
        
        if (isPaid) {
          totalRevenue += amount;
        }

        const createdDate = data.createdAt?.toDate?.() || new Date();
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        if (createdDate.getTime() >= startOfToday) {
          todaysBookingsCount++;
          if (isPaid) {
            todaysRevenue += amount;
          }
        }
      }
    });

    return {
      todayBookings: todaysBookingsCount,
      upcomingBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      todayRevenue: todaysRevenue,
      weeklyRevenue: 0,
      monthlyRevenue: totalRevenue,
      totalRevenue,
      totalTurfs,
      activeTurfs,
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
    const turfMap = new Map(turfs.map((t) => [t.id, t.name]));
    const turfIds = Array.from(turfMap.keys());

    if (turfIds.length === 0) return [];

    const snap = await firestoreDb.collection('bookings').get();
    const ownerDocs = snap.docs.filter((doc) => turfIds.includes(doc.data().turfId) && !doc.data().deletedAt);
    
    // Resolve customer names by querying user_profiles for their userIds
    const userIds = Array.from(new Set(ownerDocs.map((doc) => doc.data().userId).filter(Boolean)));
    const userMap = new Map<string, any>();
    
    if (userIds.length > 0) {
      const chunks: string[][] = [];
      for (let i = 0; i < userIds.length; i += 30) {
        chunks.push(userIds.slice(i, i + 30));
      }
      for (const chunk of chunks) {
        const uSnap = await firestoreDb.collection('user_profiles').where('userId', 'in', chunk).get();
        uSnap.forEach((uDoc) => {
          const uData = uDoc.data();
          userMap.set(uData.userId, uData);
        });
      }
    }

    const list: any[] = [];
    ownerDocs.forEach((doc) => {
      const data = doc.data();
      const uProfile = userMap.get(data.userId);
      
      const bDate = data.bookingDate instanceof Date 
        ? data.bookingDate 
        : data.bookingDate?.toDate?.() || new Date();
      const formattedDate = bDate.toISOString().split('T')[0];

      list.push({
        id: doc.id,
        customerName: data.customerName || uProfile?.name || 'Customer',
        customerPhone: data.customerPhone || uProfile?.phone || '',
        turfName: turfMap.get(data.turfId) || 'Arena',
        date: data.date || formattedDate,
        time: data.timeSlot || data.slotId || '17:00 - 18:00',
        amount: data.totalAmount || data.finalAmount || 0,
        status: data.status,
      });
    });

    // Sort newest booking dates first
    list.sort((a, b) => b.date.localeCompare(a.date));
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
