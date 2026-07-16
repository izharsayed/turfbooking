import { IOwnerRepository } from '../interfaces/IOwnerRepository.js';
import { firestoreDb } from '../../config/firebase.js';

export class FirebaseOwnerRepository implements IOwnerRepository {
  public async getDashboardStats(ownerId: string): Promise<any> {
    if (!firestoreDb) return {};

    const [
      totalTurfsSnap,
      activeTurfsSnap,
      bookingsSnap,
      reviewsSnap,
    ] = await Promise.all([
      firestoreDb.collection('turfs').where('ownerId', '==', ownerId).get(),
      firestoreDb.collection('turfs').where('ownerId', '==', ownerId).where('isActive', '==', true).get(),
      firestoreDb.collection('bookings').get(), // To filter bookings by turf owner in memory
      firestoreDb.collection('reviews').get(), // To filter reviews by turf owner in memory
    ]);

    const totalTurfs = totalTurfsSnap.size;
    const activeTurfs = activeTurfsSnap.size;

    // Filter bookings belonging to owner's turfs
    const ownerTurfIds = new Set(totalTurfsSnap.docs.map((doc) => doc.id));
    let todaysBookingsCount = 0;
    let totalBookingsCount = 0;
    let todaysRevenue = 0;
    let totalRevenue = 0;
    const uniqueCustomers = new Set<string>();

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    bookingsSnap.forEach((doc) => {
      const data = doc.data();
      if (ownerTurfIds.has(data.turfId) && !data.deletedAt && data.status !== 'CANCELLED') {
        totalBookingsCount++;
        
        // Track unique customer identifier
        const customerId = data.userId === ownerId 
          ? (data.customerPhone || data.customerName || `offline_${doc.id}`)
          : (data.userId || data.customerPhone || `online_${doc.id}`);
        if (customerId) uniqueCustomers.add(customerId);

        const isPaid = data.paymentStatus === 'PAID' || data.status === 'CONFIRMED' || data.status === 'COMPLETED';
        const amount = data.totalAmount || data.finalAmount || data.amount || 0;
        
        if (isPaid) {
          totalRevenue += amount;
        }

        const bDate = data.bookingDate instanceof Date 
          ? data.bookingDate 
          : data.bookingDate?.toDate?.() || null;
        let formattedDate = null;
        if (bDate) {
          const y = bDate.getFullYear();
          const m = String(bDate.getMonth() + 1).padStart(2, '0');
          const d = String(bDate.getDate()).padStart(2, '0');
          formattedDate = `${y}-${m}-${d}`;
        }
        const bookingDateStr = data.date || formattedDate;

        if (bookingDateStr === todayStr) {
          todaysBookingsCount++;
          if (isPaid) {
            todaysRevenue += amount;
          }
        }
      }
    });

    // Calculate average rating for owner's turfs
    let totalRatingSum = 0;
    let reviewCount = 0;
    const recentReviewsList: any[] = [];

    reviewsSnap.forEach((doc) => {
      const data = doc.data();
      if (ownerTurfIds.has(data.turfId)) {
        totalRatingSum += data.rating || 0;
        reviewCount++;
        recentReviewsList.push({ id: doc.id, ...data });
      }
    });

    const averageRating = reviewCount > 0 ? Number((totalRatingSum / reviewCount).toFixed(1)) : 0.0;
    const occupancyRate = totalTurfs > 0 ? Number(((totalBookingsCount / (totalTurfs * 30)) * 100).toFixed(0)) : 0;

    return {
      todayBookings: todaysBookingsCount,
      totalBookings: totalBookingsCount,
      totalCustomers: uniqueCustomers.size,
      upcomingBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      todayRevenue: todaysRevenue,
      weeklyRevenue: 0,
      monthlyRevenue: totalRevenue,
      totalRevenue,
      totalTurfs,
      activeTurfs,
      occupancyRate,
      fillRate: occupancyRate,
      mostBookedTurf: null,
      peakBookingHours: [],
      recentCustomers: Array.from(uniqueCustomers),
      recentReviews: recentReviewsList.slice(0, 5),
      averageRating,
      rating: averageRating,
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
      const y = bDate.getFullYear();
      const m = String(bDate.getMonth() + 1).padStart(2, '0');
      const d = String(bDate.getDate()).padStart(2, '0');
      const formattedDate = `${y}-${m}-${d}`;

      list.push({
        id: doc.id,
        userId: data.userId || '',
        turfId: data.turfId || '',
        sportId: data.sportId || '',
        customerName: data.customerName || uProfile?.name || 'Customer',
        customerPhone: data.customerPhone || uProfile?.phone || '',
        turfName: turfMap.get(data.turfId) || 'Arena',
        date: data.date || formattedDate,
        time: data.timeSlot || data.slotId || '17:00 - 18:00',
        amount: data.totalAmount || data.finalAmount || 0,
        status: data.status,
        transactionId: data.transactionId || '',
        paymentProof: data.paymentProof || '',
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

  public async listEmployees(ownerId: string): Promise<any[]> {
    if (!firestoreDb) return [];
    const snap = await firestoreDb.collection('employees').where('ownerId', '==', ownerId).get();
    const list: any[] = [];
    snap.forEach((doc) => {
      const { passwordHash: _ph, ...safeData } = doc.data() as any;
      list.push({ id: doc.id, ...safeData });
    });
    return list;
  }

  public async createEmployee(ownerId: string, data: any): Promise<any> {
    if (!firestoreDb) return null;
    const docRef = firestoreDb.collection('employees').doc();
    const newEmp = {
      ownerId,
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      role: data.role || 'Caretaker',
      turfId: data.turfId || '',
      turfName: data.turfName || 'All Turfs',
      status: data.status || 'Active',
      passwordHash: data.passwordHash || null,
      createdAt: new Date(),
    };
    await docRef.set(newEmp);
    const { passwordHash: _ph, ...safeEmp } = newEmp;
    return { id: docRef.id, ...safeEmp };
  }

  public async updateEmployee(employeeId: string, data: any): Promise<any> {
    if (!firestoreDb) return null;
    const docRef = firestoreDb.collection('employees').doc(employeeId);
    await docRef.update({
      ...data,
      updatedAt: new Date(),
    });
    const doc = await docRef.get();
    const { passwordHash: _ph, ...safeData } = doc.data() as any;
    return { id: doc.id, ...safeData };
  }

  public async deleteEmployee(employeeId: string): Promise<any> {
    if (!firestoreDb) return null;
    const docRef = firestoreDb.collection('employees').doc(employeeId);
    await docRef.delete();
    return { success: true };
  }
}
