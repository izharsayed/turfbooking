import { AuthService } from '../src/modules/auth/auth.service.js';
import { MockUserRepository } from './mocks/UserRepository.mock.js';
import { userRepository } from '../src/repositories/index.js';

jest.mock('../src/repositories/index.js', () => {
  const { MockUserRepository } = require('./mocks/UserRepository.mock.js');
  return {
    userRepository: new MockUserRepository(),
  };
});

describe('🔐 Authentication Service Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should successfully register a customer', async () => {
    const registerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+919876543210',
      password: 'Password@123',
      acceptTerms: true,
    };

    const result = await authService.registerCustomer(registerData);
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(registerData.email);
    expect(result.user.role).toBe('CUSTOMER');
  });

  it('should prevent registration of existing email', async () => {
    const registerData = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: '+919876543211',
      password: 'Password@123',
      acceptTerms: true,
    };

    // First signup
    await authService.registerCustomer(registerData);

    // Second signup
    await expect(authService.registerCustomer(registerData)).rejects.toThrow(
      'User already exists with this email'
    );
  });

  it('should successfully register an owner in pending status', async () => {
    const ownerData = {
      email: 'owner@turfclub.com',
      phone: '+919999888877',
      password: 'Password@123',
      companyName: 'Bandra Turf Club',
      businessRegisterNumber: 'BTC12345',
      businessAddress: 'Bandra West, Mumbai',
      billingEmail: 'billing@turfclub.com',
    };

    const result = await authService.registerOwner(ownerData);
    expect(result.user).toBeDefined();
    expect(result.user.isActive).toBe(false); // Pending approval
    expect(result.user.role).toBe('TURF_OWNER');
  });
});
