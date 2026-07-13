import { User } from '../../shared/types/domain.js';
import { IUserRepository } from '../interfaces/IUserRepository.js';
import { firestoreDb } from '../../config/firebase.js';

export class FirebaseUserRepository implements IUserRepository {
  private get collection() {
    if (!firestoreDb) {
      throw new Error('Firestore Database is not initialized. Check environmental credentials.');
    }
    return firestoreDb.collection('users');
  }

  private get profileCollection() {
    if (!firestoreDb) {
      throw new Error('Firestore Database is not initialized.');
    }
    return firestoreDb.collection('user_profiles');
  }

  private get ownerProfileCollection() {
    if (!firestoreDb) {
      throw new Error('Firestore Database is not initialized.');
    }
    return firestoreDb.collection('owner_profiles');
  }

  public async findById(id: string): Promise<User | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (data?.deletedAt) return null;
    return this.mapUser(doc.id, data);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const snap = await this.collection.where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = doc.data();
    if (data?.deletedAt) return null;
    return this.mapUser(doc.id, data);
  }

  public async findByPhone(phone: string): Promise<User | null> {
    const snap = await this.collection.where('phone', '==', phone).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = doc.data();
    if (data?.deletedAt) return null;
    return this.mapUser(doc.id, data);
  }

  public async findByEmailWithPassword(email: string): Promise<{ user: User; passwordHash: string } | null> {
    const snap = await this.collection.where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = doc.data();
    if (data?.deletedAt) return null;
    return {
      user: this.mapUser(doc.id, data),
      passwordHash: data.passwordHash,
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
    const docRef = this.collection.doc();
    const userId = docRef.id;

    const newUser = {
      email: data.email,
      phone: data.phone,
      passwordHash: data.passwordHash,
      role: 'CUSTOMER',
      isActive: true,
      avatarUrl: data.avatarUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const newProfile = {
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await docRef.set(newUser);
    await this.profileCollection.doc(userId).set(newProfile);

    return this.mapUser(userId, { ...newUser, name: `${data.firstName} ${data.lastName}` });
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
    const docRef = this.collection.doc();
    const userId = docRef.id;

    const newUser = {
      email: data.email,
      phone: data.phone,
      passwordHash: data.passwordHash,
      role: 'TURF_OWNER',
      isActive: false, // Pending Super Admin approval
      avatarUrl: data.avatarUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const newOwnerProfile = {
      userId,
      companyName: data.companyName,
      businessRegisterNumber: data.businessRegisterNumber,
      businessAddress: data.businessAddress,
      billingEmail: data.billingEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await docRef.set(newUser);
    await this.ownerProfileCollection.doc(userId).set(newOwnerProfile);

    return this.mapUser(userId, { ...newUser, name: data.companyName });
  }

  public async update(id: string, userData: Partial<User>): Promise<User> {
    const docRef = this.collection.doc(id);
    const updateData: any = {
      updatedAt: new Date(),
    };
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    if (userData.avatarUrl !== undefined) updateData.avatarUrl = userData.avatarUrl;
    if (userData.role !== undefined) updateData.role = userData.role;
    if (userData.isActive !== undefined) updateData.isActive = userData.isActive;
    if (userData.deletedAt !== undefined) updateData.deletedAt = userData.deletedAt;

    await docRef.update(updateData);
    const updatedDoc = await docRef.get();
    return this.mapUser(id, updatedDoc.data());
  }

  public async getProfile(userId: string): Promise<any> {
    const doc = await this.profileCollection.doc(userId).get();
    if (!doc.exists) return null;
    return doc.data();
  }

  public async updateProfile(userId: string, profileData: any): Promise<any> {
    const docRef = this.profileCollection.doc(userId);
    await docRef.set({
      ...profileData,
      updatedAt: new Date(),
    }, { merge: true });
    const doc = await docRef.get();
    return doc.data();
  }

  public async getOwnerProfile(userId: string): Promise<any> {
    const doc = await this.ownerProfileCollection.doc(userId).get();
    if (!doc.exists) return null;
    return doc.data();
  }

  public async updateOwnerProfile(userId: string, ownerProfileData: any): Promise<any> {
    const docRef = this.ownerProfileCollection.doc(userId);
    await docRef.set({
      ...ownerProfileData,
      updatedAt: new Date(),
    }, { merge: true });
    const doc = await docRef.get();
    return doc.data();
  }

  private mapUser(id: string, data: any): User {
    return {
      id,
      name: data.name || data.email,
      email: data.email,
      phone: data.phone,
      avatarUrl: data.avatarUrl || undefined,
      role: data.role,
      isActive: data.isActive,
      createdAt: data.createdAt instanceof Date ? data.createdAt : data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt?.toDate?.() || new Date(),
      deletedAt: data.deletedAt ? (data.deletedAt instanceof Date ? data.deletedAt : data.deletedAt?.toDate?.()) : undefined,
    };
  }
}
