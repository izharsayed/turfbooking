import { IAdminRepository } from '../interfaces/IAdminRepository.js';
import { prisma } from '../../database/index.js';

export class PrismaAdminRepository implements IAdminRepository {
  public async getDashboardStats(): Promise<any> {
    const [
      totalUsers,
      totalOwners,
      pendingOwners,
      approvedOwners,
      totalTurfs,
      activeTurfs,
      todaysBookings,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null } }),
      prisma.user.count({ where: { role: 'TURF_OWNER', deletedAt: null } }),
      prisma.user.count({ where: { role: 'TURF_OWNER', isActive: false, deletedAt: null } }),
      prisma.user.count({ where: { role: 'TURF_OWNER', isActive: true, deletedAt: null } }),
      prisma.turf.count({ where: { deletedAt: null } }),
      prisma.turf.count({ where: { isActive: true, deletedAt: null } }),
      prisma.booking.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          deletedAt: null,
        },
      }),
    ]);

    // Aggregate revenues
    const revenueAggregate = await prisma.booking.aggregate({
      where: { paymentStatus: 'PAID', deletedAt: null },
      _sum: {
        finalAmount: true,
        platformCommission: true,
      },
    });

    const totalRevenue = revenueAggregate._sum.finalAmount || 0;
    const platformRevenue = revenueAggregate._sum.platformCommission || 0;
    const ownerRevenue = totalRevenue - platformRevenue;

    return {
      totalUsers,
      totalCustomers: totalUsers, // frontend compat
      totalTurfOwners: totalOwners,
      pendingOwnerApprovals: pendingOwners,
      pendingOwners, // frontend compat
      approvedOwners,
      rejectedOwners: 0,
      blockedUsers: 0,
      totalTurfs,
      activeTurfs,
      inactiveTurfs: totalTurfs - activeTurfs,
      todayBookings: todaysBookings,
      bookingsToday: todaysBookings, // frontend compat
      todayRevenue: 0,
      revenueToday: 0, // frontend compat
      monthlyRevenue: totalRevenue,
      platformRevenue,
      ownerRevenue,
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
    const where: any = { deletedAt: null };
    if (filters.role) where.role = filters.role;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: { profile: true, ownerProfile: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u: any) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      name: u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.ownerProfile?.companyName || 'N/A',
    }));
  }

  public async listOwners(): Promise<any[]> {
    const owners = await prisma.user.findMany({
      where: { role: 'TURF_OWNER', deletedAt: null },
      include: { ownerProfile: true },
      orderBy: { createdAt: 'desc' },
    });
    return owners.map((o: any) => {
      const statusStr = o.isActive ? 'APPROVED' : 'PENDING';
      return {
        id: o.id,
        email: o.email,
        phone: o.phone,
        isActive: o.isActive,
        createdAt: o.createdAt,
        companyName: o.ownerProfile?.companyName || 'N/A',
        businessRegisterNumber: o.ownerProfile?.businessRegisterNumber || 'N/A',
        businessAddress: o.ownerProfile?.businessAddress || 'N/A',
        ownerStatus: statusStr,
        status: statusStr,
      };
    });
  }

  public async updateOwnerApproval(
    ownerId: string,
    status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ): Promise<any> {
    const isActive = status === 'APPROVED';
    const user = await prisma.user.update({
      where: { id: ownerId },
      data: {
        isActive,
      },
    });
    return user;
  }

  public async updateTurfStatus(
    turfId: string,
    status: { isActive?: boolean; isFeatured?: boolean }
  ): Promise<any> {
    const data: any = {};
    if (status.isActive !== undefined) data.isActive = status.isActive;
    // (Note: custom settings like isFeatured can be saved in attributes or schema extensions)
    const turf = await prisma.turf.update({
      where: { id: turfId },
      data,
    });
    return turf;
  }

  public async updateOwnerPayment(
    ownerId: string,
    status: 'PENDING' | 'PAID',
    paymentEntry?: { amount: number; type: string; paymentMethod: string; transactionId?: string }
  ): Promise<any> {
    // Stub implementation for Prisma provider (not active)
    return { id: ownerId, paymentStatus: status, paymentHistory: paymentEntry ? [paymentEntry] : [] };
  }

  public async listAuditLogs(): Promise<any[]> {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  public async createAuditLog(log: any): Promise<any> {
    return prisma.auditLog.create({
      data: {
        userId: log.userId,
        action: log.action,
        tableName: log.tableName,
        recordId: log.recordId,
        oldValues: log.oldValues || null,
        newValues: log.newValues || null,
        ipAddress: log.ipAddress || null,
        userAgent: log.userAgent || null,
      },
    });
  }
}
