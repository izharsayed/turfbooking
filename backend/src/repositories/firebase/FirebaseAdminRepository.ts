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
      allUsersSnap,
      totalTurfsSnap,
      activeTurfsSnap,
      bookingsSnap,
    ] = await Promise.all([
      this.collection.get(),                                            // All users
      firestoreDb.collection('turfs').get(),                           // All turfs
      firestoreDb.collection('turfs').where('isActive', '==', true).get(), // Active turfs
      firestoreDb.collection('bookings').get(),                        // All bookings
    ]);

    // Client-side filter to avoid composite index requirements
    const allUsers = allUsersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    const customers      = allUsers.filter(u => u.role === 'CUSTOMER'   && !u.deletedAt);
    const allOwners      = allUsers.filter(u => u.role === 'TURF_OWNER' && !u.deletedAt);
    const pendingOwners  = allOwners.filter(u => !u.isActive);
    const approvedOwners = allOwners.filter(u =>  u.isActive);

    const totalTurfs = totalTurfsSnap.size;
    const activeTurfs = activeTurfsSnap.size;
    const todayBookings = bookingsSnap.size;

    return {
      totalUsers:              customers.length,
      totalTurfOwners:         allOwners.length,
      pendingOwnerApprovals:   pendingOwners.length,
      approvedOwners:          approvedOwners.length,
      rejectedOwners:          0,
      blockedUsers:            allUsers.filter(u => !u.isActive && u.role === 'CUSTOMER').length,
      totalTurfs,
      activeTurfs,
      inactiveTurfs:           totalTurfs - activeTurfs,
      todayBookings,
      todayRevenue:            0,
      monthlyRevenue:          0,
      platformRevenue:         0,
      ownerRevenue:            0,
      refundAmount:            0,
      pendingRefunds:          0,
      totalCoupons:            0,
      activeCoupons:           0,
      expiredCoupons:          0,
      averageRating:           0.0,
      mostPopularTurf:         null,
      mostPopularSport:        null,
      topCities:               [],
      peakBookingHours:        [],
      recentBookings:          [],
      recentRegisteredUsers:   customers.slice(-5).reverse(),
      recentRegisteredOwners:  allOwners.slice(-5).reverse(),
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
        const createdAt = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString()) : new Date().toISOString();
        const updatedAt = data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt).toISOString()) : new Date().toISOString();
        
        list.push({ 
          id: doc.id, 
          ...data,
          createdAt,
          updatedAt,
          ownerStatus: data.ownerStatus || (data.isActive ? 'APPROVED' : 'PENDING')
        });
      }
    });
    return list;
  }

  public async updateOwnerApproval(
    ownerId: string,
    status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ): Promise<any> {
    const docRef = this.collection.doc(ownerId);
    const isActive = status === 'APPROVED';
    const updateData: any = { 
      isActive, 
      ownerStatus: status, 
      updatedAt: new Date() 
    };
    if (rejectionReason !== undefined) {
      updateData.rejectionReason = rejectionReason;
    }
    await docRef.update(updateData);
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
