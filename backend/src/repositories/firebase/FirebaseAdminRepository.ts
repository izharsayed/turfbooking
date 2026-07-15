import { IAdminRepository } from '../interfaces/IAdminRepository.js';
import { firestoreDb } from '../../config/firebase.js';
import { ValidationError } from '../../shared/utils/errors.js';

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

    // Filter bookings created today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const allBookings: any[] = bookingsSnap.docs.map(d => {
      const data = d.data();
      let createdAtDate = new Date();
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          createdAtDate = data.createdAt.toDate();
        } else {
          createdAtDate = new Date(data.createdAt);
        }
      }
      return { id: d.id, ...data, createdAt: createdAtDate };
    });

    const todayBookingsList = allBookings.filter(b => b.createdAt >= startOfToday);
    const todayBookingsCount = todayBookingsList.length;

    const todayRevenueSum = todayBookingsList
      .filter(b => b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + (Number(b.totalAmount) || Number(b.amount) || 0), 0);

    return {
      totalUsers:              customers.length,
      totalCustomers:          customers.length, // frontend compat
      totalTurfOwners:         allOwners.length,
      pendingOwnerApprovals:   pendingOwners.length,
      pendingOwners:           pendingOwners.length, // frontend compat
      approvedOwners:          approvedOwners.length,
      rejectedOwners:          0,
      blockedUsers:            allUsers.filter(u => !u.isActive && u.role === 'CUSTOMER').length,
      totalTurfs,
      activeTurfs,
      inactiveTurfs:           totalTurfs - activeTurfs,
      todayBookings:           todayBookingsCount,
      bookingsToday:           todayBookingsCount, // frontend compat
      todayRevenue:            todayRevenueSum,
      revenueToday:            todayRevenueSum, // frontend compat
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

    const [snap, profilesSnap, ownerProfilesSnap] = await Promise.all([
      query.get(),
      firestoreDb!.collection('user_profiles').get(),
      firestoreDb!.collection('owner_profiles').get(),
    ]);

    const profilesMap = new Map();
    profilesSnap.forEach(d => {
      const data = d.data();
      if (data.userId) {
        profilesMap.set(data.userId, `${data.firstName || ''} ${data.lastName || ''}`.trim());
      }
    });

    const ownerProfilesMap = new Map();
    ownerProfilesSnap.forEach(d => {
      const data = d.data();
      if (data.userId) {
        ownerProfilesMap.set(data.userId, data.companyName);
      }
    });

    const list: any[] = [];
    snap.forEach((doc: any) => {
      const data = doc.data();
      if (!data.deletedAt) {
        let name = '';
        if (data.role === 'CUSTOMER') {
          name = profilesMap.get(doc.id) || '';
        } else if (data.role === 'TURF_OWNER') {
          name = ownerProfilesMap.get(doc.id) || '';
        }
        list.push({ 
          id: doc.id, 
          ...data, 
          name: name || data.name || 'No name',
          isBlocked: !data.isActive
        });
      }
    });

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return list.filter(
        (u) =>
          u.email?.toLowerCase().includes(searchLower) ||
          u.phone?.toLowerCase().includes(searchLower) ||
          u.name?.toLowerCase().includes(searchLower)
      );
    }

    return list;
  }

  public async listOwners(): Promise<any[]> {
    const [snap, ownerProfilesSnap] = await Promise.all([
      this.collection.where('role', '==', 'TURF_OWNER').get(),
      firestoreDb!.collection('owner_profiles').get(),
    ]);

    const ownerProfilesMap = new Map();
    ownerProfilesSnap.forEach(d => {
      const data = d.data();
      if (data.userId) {
        ownerProfilesMap.set(data.userId, data);
      }
    });

    const list: any[] = [];
    snap.forEach((doc: any) => {
      const data = doc.data();
      if (!data.deletedAt) {
        const createdAt = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString()) : new Date().toISOString();
        const updatedAt = data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt).toISOString()) : new Date().toISOString();
        const profile = ownerProfilesMap.get(doc.id) || {};
        
        list.push({ 
          id: doc.id, 
          ...data,
          name: profile.companyName || data.name || data.companyName || '',
          createdAt,
          updatedAt,
          ownerStatus: data.ownerStatus || (data.isActive ? 'APPROVED' : 'PENDING'),
          paymentStatus: data.paymentStatus || profile.paymentStatus || 'PENDING',
          paymentHistory: data.paymentHistory || profile.paymentHistory || []
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

  public async updateOwnerPayment(
    ownerId: string,
    status: 'PENDING' | 'PAID',
    paymentEntry?: { amount: number; type: string; paymentMethod: string; transactionId?: string }
  ): Promise<any> {
    const docRef = this.collection.doc(ownerId);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('Owner user not found');

    const data = doc.data() || {};
    const ownerStatus = data.ownerStatus || (data.isActive ? 'APPROVED' : 'PENDING');
    if (ownerStatus !== 'APPROVED') {
      throw new ValidationError('Cannot manage payments for unapproved owners. Please approve the owner first.');
    }

    const history = data.paymentHistory || [];

    if (paymentEntry) {
      history.push({
        id: `pay_${Date.now()}`,
        date: new Date().toISOString(),
        ...paymentEntry,
      });
    }

    const updateData: any = {
      paymentStatus: status,
      paymentHistory: history,
      updatedAt: new Date(),
    };

    await docRef.update(updateData);

    const profileRef = firestoreDb!.collection('owner_profiles').doc(ownerId);
    const profileDoc = await profileRef.get();
    if (profileDoc.exists) {
      await profileRef.update({
        paymentStatus: status,
        paymentHistory: history,
        updatedAt: new Date(),
      });
    }

    return { id: ownerId, ...data, ...updateData };
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
