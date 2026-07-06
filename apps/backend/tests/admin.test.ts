import { AdminService } from '../src/modules/admin/admin.service.js';

jest.mock('../src/repositories/index.js', () => {
  return {
    adminRepository: {
      getDashboardStats: jest.fn().mockResolvedValue({
        totalUsers: 10,
        totalTurfOwners: 2,
        pendingOwnerApprovals: 1,
        approvedOwners: 1,
        totalTurfs: 5,
        activeTurfs: 4,
      }),
      listUsers: jest.fn().mockResolvedValue([]),
      listOwners: jest.fn().mockResolvedValue([]),
    },
    sportRepository: {},
    amenityRepository: {},
    cityRepository: {},
    couponRepository: {},
    subscriptionRepository: {},
    settingRepository: {},
    userRepository: {},
  };
});

describe('👑 Super Admin Service Tests', () => {
  let adminService: AdminService;

  beforeEach(() => {
    adminService = new AdminService();
    jest.clearAllMocks();
  });

  it('should retrieve dashboard statistics rollup', async () => {
    const stats = await adminService.getDashboardStats();
    expect(stats).toBeDefined();
    expect(stats.totalUsers).toBe(10);
    expect(stats.totalTurfs).toBe(5);
    expect(stats.pendingOwnerApprovals).toBe(1);
  });

  it('should list platform users successfully', async () => {
    const users = await adminService.getUsers({});
    expect(users).toBeInstanceOf(Array);
    expect(users.length).toBe(0);
  });
});
