import { OwnerService } from '../src/modules/owner/owner.service.js';

const mockStats = {
  todayBookings: 3,
  totalRevenue: 2400,
  monthlyRevenue: 2400,
};

jest.mock('../src/repositories/index.js', () => {
  return {
    ownerRepository: {
      getDashboardStats: jest.fn().mockResolvedValue({
        todayBookings: 3,
        totalRevenue: 2400,
        monthlyRevenue: 2400,
      }),
      listTurfs: jest.fn().mockResolvedValue([]),
      listBookings: jest.fn().mockResolvedValue([]),
    },
    turfRepository: {
      create: jest.fn().mockResolvedValue({ id: 'turf-123', name: 'Test Turf' }),
    },
    bookingRepository: {},
    paymentRepository: {},
    couponRepository: {},
    userRepository: {},
  };
});

describe('🏟️ Turf Owner Service Tests', () => {
  let ownerService: OwnerService;

  beforeEach(() => {
    ownerService = new OwnerService();
    jest.clearAllMocks();
  });

  it('should retrieve owner dashboard stats', async () => {
    const stats = await ownerService.getDashboardStats('owner-123');
    expect(stats).toBeDefined();
    expect(stats.todayBookings).toBe(mockStats.todayBookings);
    expect(stats.totalRevenue).toBe(mockStats.totalRevenue);
  });

  it('should list owner turfs successfully', async () => {
    const turfs = await ownerService.getTurfs('owner-123');
    expect(turfs).toBeInstanceOf(Array);
    expect(turfs.length).toBe(0);
  });
});
