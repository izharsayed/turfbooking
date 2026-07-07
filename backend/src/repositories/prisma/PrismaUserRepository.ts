import { User } from '@turf-booking/types';
import { IUserRepository } from '../interfaces/IUserRepository.js';
import { prisma } from '../../database/index.js';

export class PrismaUserRepository implements IUserRepository {
  public async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true, ownerProfile: true },
    });
    if (!user || user.deletedAt) return null;
    return this.mapUser(user);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true, ownerProfile: true },
    });
    if (!user || user.deletedAt) return null;
    return this.mapUser(user);
  }

  public async findByPhone(phone: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { phone },
      include: { profile: true, ownerProfile: true },
    });
    if (!user || user.deletedAt) return null;
    return this.mapUser(user);
  }

  public async findByEmailWithPassword(email: string): Promise<{ user: User; passwordHash: string } | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true, ownerProfile: true },
    });
    if (!user || user.deletedAt) return null;
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
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        role: 'CUSTOMER',
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
          },
        },
      },
      include: { profile: true },
    });
    return this.mapUser(user);
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
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        role: 'TURF_OWNER',
        isActive: false, // Pending Super Admin approval
        ownerProfile: {
          create: {
            companyName: data.companyName,
            businessRegisterNumber: data.businessRegisterNumber,
            businessAddress: data.businessAddress,
            billingEmail: data.billingEmail,
          },
        },
      },
      include: { ownerProfile: true },
    });
    return this.mapUser(user);
  }

  public async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        email: userData.email,
        phone: userData.phone,
        role: userData.role as any,
        isActive: userData.isActive,
        deletedAt: userData.deletedAt,
      },
      include: { profile: true, ownerProfile: true },
    });
    return this.mapUser(user);
  }

  public async getProfile(userId: string): Promise<any> {
    return prisma.userProfile.findUnique({
      where: { userId },
    });
  }

  public async updateProfile(userId: string, profileData: any): Promise<any> {
    return prisma.userProfile.update({
      where: { userId },
      data: profileData,
    });
  }

  public async getOwnerProfile(userId: string): Promise<any> {
    return prisma.ownerProfile.findUnique({
      where: { userId },
    });
  }

  public async updateOwnerProfile(userId: string, ownerProfileData: any): Promise<any> {
    return prisma.ownerProfile.update({
      where: { userId },
      data: ownerProfileData,
    });
  }

  private mapUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      name: prismaUser.profile 
        ? `${prismaUser.profile.firstName} ${prismaUser.profile.lastName}` 
        : prismaUser.ownerProfile?.companyName || 'Turf Owner',
      email: prismaUser.email,
      phone: prismaUser.phone,
      role: prismaUser.role as any,
      isActive: prismaUser.isActive,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      deletedAt: prismaUser.deletedAt || undefined,
    };
  }
}
