import { User, UserRole } from '@turf-booking/types';
import { IUserRepository } from '../../src/repositories/interfaces/IUserRepository.js';

export class MockUserRepository implements IUserRepository {
  private users: (User & { passwordHash: string })[] = [];
  private profiles = new Map<string, any>();
  private ownerProfiles = new Map<string, any>();

  public async findById(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id && !u.deletedAt);
    if (!user) return null;
    return this.mapUser(user);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((u) => u.email === email && !u.deletedAt);
    if (!user) return null;
    return this.mapUser(user);
  }

  public async findByPhone(phone: string): Promise<User | null> {
    const user = this.users.find((u) => u.phone === phone && !u.deletedAt);
    if (!user) return null;
    return this.mapUser(user);
  }

  public async findByEmailWithPassword(email: string): Promise<{ user: User; passwordHash: string } | null> {
    const user = this.users.find((u) => u.email === email && !u.deletedAt);
    if (!user) return null;
    return {
      user: this.mapUser(user),
      passwordHash: user.passwordHash,
    };
  }

  public async createCustomer(data: {
    email: string;
    phone: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }): Promise<User> {
    const userId = Math.random().toString(36).substring(7);
    const newUser: User & { passwordHash: string } = {
      id: userId,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      role: 'CUSTOMER',
      isActive: true,
      avatarUrl: data.avatarUrl,
      passwordHash: data.passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
    };

    this.users.push(newUser);
    this.profiles.set(userId, {
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return this.mapUser(newUser);
  }

  public async createOwner(data: {
    email: string;
    phone: string;
    passwordHash: string;
    companyName: string;
    businessRegisterNumber: string;
    businessAddress: string;
    billingEmail: string;
    avatarUrl?: string;
  }): Promise<User> {
    const userId = Math.random().toString(36).substring(7);
    const newUser: User & { passwordHash: string } = {
      id: userId,
      name: data.companyName,
      email: data.email,
      phone: data.phone,
      role: 'TURF_OWNER',
      isActive: false, // Pending approval
      avatarUrl: data.avatarUrl,
      passwordHash: data.passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
    };

    this.users.push(newUser);
    this.ownerProfiles.set(userId, {
      userId,
      companyName: data.companyName,
      businessRegisterNumber: data.businessRegisterNumber,
      businessAddress: data.businessAddress,
      billingEmail: data.billingEmail,
    });

    return this.mapUser(newUser);
  }

  public async update(id: string, userData: Partial<User>): Promise<User> {
    const index = this.users.findIndex((u) => u.id === id && !u.deletedAt);
    if (index === -1) {
      throw new Error('User not found');
    }

    const updated = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date(),
    };
    this.users[index] = updated;
    return this.mapUser(updated);
  }

  public async getProfile(userId: string): Promise<any> {
    return this.profiles.get(userId) || null;
  }

  public async updateProfile(userId: string, profileData: any): Promise<any> {
    const current = this.profiles.get(userId) || {};
    const updated = { ...current, ...profileData, updatedAt: new Date() };
    this.profiles.set(userId, updated);
    return updated;
  }

  public async getOwnerProfile(userId: string): Promise<any> {
    return this.ownerProfiles.get(userId) || null;
  }

  public async updateOwnerProfile(userId: string, ownerProfileData: any): Promise<any> {
    const current = this.ownerProfiles.get(userId) || {};
    const updated = { ...current, ...ownerProfileData, updatedAt: new Date() };
    this.ownerProfiles.set(userId, updated);
    return updated;
  }

  private mapUser(user: User): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }
}
