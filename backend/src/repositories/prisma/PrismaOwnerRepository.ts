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
    const bookings = await prisma.booking.findMany({
      where: { turf: { ownerId }, deletedAt: null },
      include: { user: { include: { profile: true } }, turf: true },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((b: any) => {
      const bDate = b.date;
      const y = bDate.getFullYear();
      const m = String(bDate.getMonth() + 1).padStart(2, '0');
      const d = String(bDate.getDate()).padStart(2, '0');
      const formattedDate = `${y}-${m}-${d}`;

      // Convert startTime / endTime to a display slot string e.g. "17:00 - 18:00"
      const sh = String(b.startTime.getHours()).padStart(2, '0');
      const sm = String(b.startTime.getMinutes()).padStart(2, '0');
      const eh = String(b.endTime.getHours()).padStart(2, '0');
      const em = String(b.endTime.getMinutes()).padStart(2, '0');
      const timeSlotStr = `${sh}:${sm} - ${eh}:${em}`;

      const fName = b.user?.profile?.firstName || '';
      const lName = b.user?.profile?.lastName || '';
      const fullName = `${fName} ${lName}`.trim() || b.user?.name || 'Customer';

      return {
        id: b.id,
        userId: b.userId,
        turfId: b.turfId,
        sportId: b.sportId,
        customerName: fullName,
        customerPhone: b.user?.phone || '',
        turfName: b.turf?.name || 'Arena',
        date: formattedDate,
        time: timeSlotStr,
        amount: b.finalAmount,
        status: b.bookingStatus,
        createdAt: b.createdAt,
      };
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
