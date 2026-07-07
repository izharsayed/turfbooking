import { IOwnerRepository } from '../interfaces/IOwnerRepository.js';
import { prisma } from '../../database/index.js';

export class PrismaOwnerRepository implements IOwnerRepository {
  public async getDashboardStats(ownerId: string): Promise<any> {
    const [
      totalTurfs,
      activeTurfs,
      todaysBookings,
    ] = await Promise.all([
      prisma.turf.count({ where: { ownerId, deletedAt: null } }),
      prisma.turf.count({ where: { ownerId, isActive: true, deletedAt: null } }),
      prisma.booking.count({
        where: {
          turf: { ownerId },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          deletedAt: null,
        },
      }),
    ]);

    // Aggregate revenues
    const revenueAggregate = await prisma.booking.aggregate({
      where: { turf: { ownerId }, paymentStatus: 'PAID', deletedAt: null },
      _sum: {
        finalAmount: true,
        platformCommission: true,
      },
    });

    const totalRevenue = revenueAggregate._sum.finalAmount || 0;
    const platformRevenue = revenueAggregate._sum.platformCommission || 0;
    const ownerRevenue = totalRevenue - platformRevenue;

    return {
      todayBookings: todaysBookings,
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
    return prisma.turf.findMany({
      where: { ownerId, deletedAt: null },
      include: { images: true, amenities: { include: { amenity: true } }, sports: { include: { sport: true } } },
    });
  }

  public async listBookings(ownerId: string): Promise<any[]> {
    return prisma.booking.findMany({
      where: { turf: { ownerId }, deletedAt: null },
      include: { user: { include: { profile: true } }, turf: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async listPayments(ownerId: string): Promise<any[]> {
    return prisma.payment.findMany({
      where: { booking: { turf: { ownerId } }, deletedAt: null },
      include: { user: true, booking: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async listReviews(ownerId: string): Promise<any[]> {
    return prisma.review.findMany({
      where: { turf: { ownerId }, deletedAt: null },
      include: { user: { include: { profile: true } }, turf: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async replyToReview(reviewId: string, reply: string): Promise<any> {
    return prisma.review.update({
      where: { id: reviewId },
      data: {
        ownerReply: reply,
      },
    });
  }
}
