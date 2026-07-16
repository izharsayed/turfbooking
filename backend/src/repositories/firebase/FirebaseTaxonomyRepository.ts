import {
  ISportRepository,
  IAmenityRepository,
  ICityRepository,
  ICouponRepository,
  ISubscriptionRepository,
  ISettingRepository,
  SportType,
  AmenityType,
  CityType,
  CouponType,
  OwnerPlanType,
  ApplicationSettingType,
} from '../interfaces/ITaxonomyRepositories.js';
import { firestoreDb } from '../../config/firebase.js';

export class FirebaseSportRepository implements ISportRepository {
  private get collection() {
    if (!firestoreDb) throw new Error('Firestore is not initialized.');
    return firestoreDb.collection('sports');
  }

  public async findAll(): Promise<SportType[]> {
    const snap = await this.collection.get();
    const list: SportType[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (!data.deletedAt) {
        list.push({ id: doc.id, ...data } as any);
      }
    });
    return list;
  }

  public async findById(id: string): Promise<SportType | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (data?.deletedAt) return null;
    return { id: doc.id, ...data } as any;
  }

  public async create(data: { name: string; slug: string; description?: string }): Promise<SportType> {
    const docRef = this.collection.doc();
    const item = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await docRef.set(item);
    return { id: docRef.id, ...item } as any;
  }

  public async update(id: string, data: Partial<SportType>): Promise<SportType> {
    const docRef = this.collection.doc(id);
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    await docRef.update(updateData);
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() } as any;
  }

  public async delete(id: string): Promise<void> {
    await this.collection.doc(id).update({ deletedAt: new Date() });
  }
}

export class FirebaseAmenityRepository implements IAmenityRepository {
  private get collection() {
    if (!firestoreDb) throw new Error('Firestore is not initialized.');
    return firestoreDb.collection('amenities');
  }

  public async findAll(): Promise<AmenityType[]> {
    const snap = await this.collection.get();
    const list: AmenityType[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (!data.deletedAt) {
        list.push({ id: doc.id, ...data } as any);
      }
    });
    return list;
  }

  public async findById(id: string): Promise<AmenityType | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (data?.deletedAt) return null;
    return { id: doc.id, ...data } as any;
  }

  public async create(data: { name: string; iconUrl?: string; description?: string }): Promise<AmenityType> {
    const docRef = this.collection.doc();
    const item = {
      name: data.name,
      iconUrl: data.iconUrl || null,
      description: data.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await docRef.set(item);
    return { id: docRef.id, ...item } as any;
  }

  public async update(id: string, data: Partial<AmenityType>): Promise<AmenityType> {
    const docRef = this.collection.doc(id);
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    await docRef.update(updateData);
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() } as any;
  }

  public async delete(id: string): Promise<void> {
    await this.collection.doc(id).update({ deletedAt: new Date() });
  }
}

export class FirebaseCityRepository implements ICityRepository {
  private get collection() {
    if (!firestoreDb) throw new Error('Firestore is not initialized.');
    return firestoreDb.collection('cities');
  }

  public async findAll(): Promise<CityType[]> {
    const snap = await this.collection.get();
    const list: CityType[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (!data.deletedAt) {
        list.push({ id: doc.id, ...data } as any);
      }
    });
    return list;
  }

  public async findById(id: string): Promise<CityType | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (data?.deletedAt) return null;
    return { id: doc.id, ...data } as any;
  }

  public async create(data: { name: string; slug: string; state: string }): Promise<CityType> {
    const docRef = this.collection.doc();
    const item = {
      name: data.name,
      slug: data.slug,
      state: data.state,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await docRef.set(item);
    return { id: docRef.id, ...item } as any;
  }

  public async update(id: string, data: Partial<CityType>): Promise<CityType> {
    const docRef = this.collection.doc(id);
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    await docRef.update(updateData);
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() } as any;
  }

  public async delete(id: string): Promise<void> {
    await this.collection.doc(id).update({ deletedAt: new Date() });
  }

  public async createArea(cityId: string, areaData: { name: string; slug: string; zipcode: string }): Promise<any> {
    if (!firestoreDb) return null;
    const docRef = firestoreDb.collection('areas').doc();
    const area = {
      cityId,
      name: areaData.name,
      slug: areaData.slug,
      zipcode: areaData.zipcode,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await docRef.set(area);
    return { id: docRef.id, ...area };
  }
}

export class FirebaseCouponRepository implements ICouponRepository {
  private get collection() {
    if (!firestoreDb) throw new Error('Firestore is not initialized.');
    return firestoreDb.collection('coupons');
  }

  public async findAll(): Promise<CouponType[]> {
    const snap = await this.collection.get();
    const list: CouponType[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (!data.deletedAt) {
        list.push({ id: doc.id, ...data } as any);
      }
    });
    return list;
  }

  public async findById(id: string): Promise<CouponType | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (data?.deletedAt) return null;
    return { id: doc.id, ...data } as any;
  }

  public async findByCode(code: string): Promise<CouponType | null> {
    const snap = await this.collection.where('code', '==', code).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = doc.data();
    if (data?.deletedAt) return null;
    return { id: doc.id, ...data } as any;
  }

  public async create(data: any): Promise<CouponType> {
    const docRef = this.collection.doc();
    const item = {
      code: data.code,
      description: data.description || null,
      discountType: data.discountType,
      value: data.value,
      minBookingAmount: data.minBookingAmount || 0,
      maxDiscount: data.maxDiscount || 0,
      usageLimit: data.usageLimit || 1,
      perUserLimit: data.perUserLimit || 1,
      expiryDate: new Date(data.expiryDate),
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdBy: data.createdBy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await docRef.set(item);
    return { id: docRef.id, ...item } as any;
  }

  public async update(id: string, data: Partial<CouponType>): Promise<CouponType> {
    const docRef = this.collection.doc(id);
    const updateData: any = { ...data };
    if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate);
    updateData.updatedAt = new Date();
    await docRef.update(updateData);
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() } as any;
  }

  public async delete(id: string): Promise<void> {
    await this.collection.doc(id).update({ deletedAt: new Date() });
  }
}

export class FirebaseSubscriptionRepository implements ISubscriptionRepository {
  private get collection() {
    if (!firestoreDb) throw new Error('Firestore is not initialized.');
    return firestoreDb.collection('owner_plans');
  }

  public async findAllPlans(): Promise<OwnerPlanType[]> {
    const snap = await this.collection.get();
    const list: OwnerPlanType[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (!data.deletedAt) {
        list.push({ id: doc.id, ...data } as any);
      }
    });
    return list;
  }

  public async findPlanById(id: string): Promise<OwnerPlanType | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (data?.deletedAt) return null;
    return { id: doc.id, ...data } as any;
  }

  public async createPlan(data: any): Promise<OwnerPlanType> {
    const docRef = this.collection.doc();
    const item = {
      name: data.name,
      description: data.description,
      price: data.price,
      durationDays: data.durationDays,
      maxTurfs: data.maxTurfs,
      isActive: data.isActive !== undefined ? data.isActive : true,
      features: data.features || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await docRef.set(item);
    return { id: docRef.id, ...item } as any;
  }

  public async updatePlan(id: string, data: Partial<OwnerPlanType>): Promise<OwnerPlanType> {
    const docRef = this.collection.doc(id);
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    await docRef.update(updateData);
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() } as any;
  }

  public async deletePlan(id: string): Promise<void> {
    await this.collection.doc(id).update({ deletedAt: new Date() });
  }
}

export class FirebaseSettingRepository implements ISettingRepository {
  private get collection() {
    if (!firestoreDb) throw new Error('Firestore is not initialized.');
    return firestoreDb.collection('application_settings');
  }

  public async findAll(): Promise<ApplicationSettingType[]> {
    const snap = await this.collection.get();
    const list: ApplicationSettingType[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (!data.deletedAt) {
        list.push({ id: doc.id, ...data } as any);
      }
    });
    return list;
  }

  public async findByKey(key: string): Promise<ApplicationSettingType | null> {
    const snap = await this.collection.where('key', '==', key).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = doc.data();
    if (data?.deletedAt) return null;
    return { id: doc.id, ...data } as any;
  }

  public async upsert(key: string, value: string, description?: string): Promise<ApplicationSettingType> {
    const existing = await this.findByKey(key);
    if (existing) {
      const docRef = this.collection.doc(existing.id);
      await docRef.update({ value, description: description || null, updatedAt: new Date() });
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as any;
    } else {
      const docRef = this.collection.doc();
      const item = {
        key,
        value,
        description: description || null,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await docRef.set(item);
      return { id: docRef.id, ...item } as any;
    }
  }
}
