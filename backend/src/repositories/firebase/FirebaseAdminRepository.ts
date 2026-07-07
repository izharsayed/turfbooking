import { IAdminRepository } from '../interfaces/IAdminRepository.js';
import { firestoreDb } from '../../config/firebase.js';

export class FirebaseAdminRepository implements IAdminRepository {
  private get collection() {
    if (!firestoreDb) throw new Error('Firestore is not initialized.');
    return firestoreDb.collection('users');
  }

  public async getDashboardStats(): Promise<any> {
    if (!firestoreDb) return {};
    
    const [
      totalUsersSnap,
      totalOwnersSnap,
      pendingOwnersSnap,
      approvedOwnersSnap,
      totalTurfsSnap,
      activeTurfsSnap,
      bookingsSnap,
    ] = await Promise.all([
      this.collection.where('role', '==', 'CUSTOMER').get(),
      this.collection.where('role', '==', 'TURF_OWNER').get(),
      this.collection.where('role', '==', 'TURF_OWNER').where('isActive', '==', false).get(),
      this.collection.where('role', '==', 'TURF_OWNER').where('isActive', '==', true).get(),
      firestoreDb.collection('turfs').get(),
      firestoreDb.collection('turfs').where('isActive', '==', true).get(),
      firestoreDb.collection('bookings').get(),
    ]);

    const totalUsers = totalUsersSnap.size;
    const totalOwners = totalOwnersSnap.size;
    const pendingOwners = pendingOwnersSnap.size;
    const approvedOwners = approvedOwnersSnap.size;
    const totalTurfs = totalTurfsSnap.size;
    const activeTurfs = activeTurfsSnap.size;
    const todayBookings = bookingsSnap.size;

    return {
      totalUsers,
      totalTurfOwners: totalOwners,
      pendingOwnerApprovals: pendingOwners,
      approvedOwners,
      rejectedOwners: 0,
      blockedUsers: 0,
      totalTurfs,
      activeTurfs,
      inactiveTurfs: totalTurfs - activeTurfs,
      todayBookings,
      todayRevenue: 0,
      monthlyRevenue: 0,
      platformRevenue: 0,
      ownerRevenue: 0,
      refundAmount: 0,
      pendingRefunds: 0,
      totalCoupons: 0,
      activeCoupons: 0,
      expiredCoupons: 0,
      averageRating: 0.0,
      mostPopularTurf: null,
      mostPopularSport: null,
      topCities: [],
      peakBookingHours: [],
      recentBookings: [],
      recentRegisteredUsers: [],
      recentRegisteredOwners: [],
    };
  }

  public async listUsers(filters: {
    role?: string;
    isActive?: boolean;
    cityId?: string;
    search?: string;
  }): Promise<any[]> {
    let query: any = this.collection;
    if (filters.role) query = query.where('role', '==', filters.role);
    if (filters.isActive !== undefined) query = query.where('isActive', '==', filters.isActive);

    const snap = await query.get();
    const list: any[] = [];
    snap.forEach((doc: any) => {
      const data = doc.data();
      if (!data.deletedAt) {
        list.push({ id: doc.id, ...data });
      }
    });

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return list.filter(
        (u) =>
          u.email?.toLowerCase().includes(searchLower) ||
          u.phone?.toLowerCase().includes(searchLower)
      );
    }

    return list;
  }

  public async listOwners(): Promise<any[]> {
    const snap = await this.collection.where('role', '==', 'TURF_OWNER').get();
    const list: any[] = [];
    snap.forEach((doc: any) => {
      const data = doc.data();
      if (!data.deletedAt) {
        list.push({ id: doc.id, ...data });
      }
    });
    return list;
  }

  public async updateOwnerApproval(
    ownerId: string,
    status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  ): Promise<any> {
    const docRef = this.collection.doc(ownerId);
    const isActive = status === 'APPROVED';
    await docRef.update({ isActive, updatedAt: new Date() });
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  }

  public async updateTurfStatus(
    turfId: string,
    status: { isActive?: boolean; isFeatured?: boolean }
  ): Promise<any> {
    if (!firestoreDb) return null;
    const docRef = firestoreDb.collection('turfs').doc(turfId);
    const data: any = {};
    if (status.isActive !== undefined) data.isActive = status.isActive;
    await docRef.update({ ...data, updatedAt: new Date() });
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  }

  public async listAuditLogs(): Promise<any[]> {
    if (!firestoreDb) return [];
    const snap = await firestoreDb.collection('audit_logs').orderBy('createdAt', 'desc').limit(100).get();
    const list: any[] = [];
    snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    return list;
  }

  public async createAuditLog(log: any): Promise<any> {
    if (!firestoreDb) return null;
    const docRef = firestoreDb.collection('audit_logs').doc();
    const newLog = {
      ...log,
      createdAt: new Date(),
    };
    await docRef.set(newLog);
    return { id: docRef.id, ...newLog };
  }
}
