import { User } from '@turf-booking/types';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByEmailWithPassword(email: string): Promise<{ user: User; passwordHash: string } | null>;
  
  createCustomer(data: {
    email: string;
    phone: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }): Promise<User>;

  createOwner(data: {
    email: string;
    phone: string;
    passwordHash: string;
    companyName: string;
    businessRegisterNumber: string;
    businessAddress: string;
    billingEmail: string;
    avatarUrl?: string;
  }): Promise<User>;

  update(id: string, userData: Partial<User>): Promise<User>;
  
  getProfile(userId: string): Promise<any>;
  updateProfile(userId: string, profileData: any): Promise<any>;

  getOwnerProfile(userId: string): Promise<any>;
  updateOwnerProfile(userId: string, ownerProfileData: any): Promise<any>;
}
