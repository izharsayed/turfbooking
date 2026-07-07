export interface SportType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface AmenityType {
  id: string;
  name: string;
  iconUrl?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CityType {
  id: string;
  name: string;
  slug: string;
  state: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CouponType {
  id: string;
  code: string;
  description?: string | null;
  discountType: string;
  value: number;
  minBookingAmount: number;
  maxDiscount: number;
  usageLimit: number;
  perUserLimit: number;
  expiryDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface OwnerPlanType {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  maxTurfs: number;
  isActive: boolean;
  features?: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ApplicationSettingType {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ISportRepository {
  findAll(): Promise<SportType[]>;
  findById(id: string): Promise<SportType | null>;
  create(data: { name: string; slug: string; description?: string }): Promise<SportType>;
  update(id: string, data: Partial<SportType>): Promise<SportType>;
  delete(id: string): Promise<void>;
}

export interface IAmenityRepository {
  findAll(): Promise<AmenityType[]>;
  findById(id: string): Promise<AmenityType | null>;
  create(data: { name: string; iconUrl?: string; description?: string }): Promise<AmenityType>;
  update(id: string, data: Partial<AmenityType>): Promise<AmenityType>;
  delete(id: string): Promise<void>;
}

export interface ICityRepository {
  findAll(): Promise<CityType[]>;
  findById(id: string): Promise<CityType | null>;
  create(data: { name: string; slug: string; state: string }): Promise<CityType>;
  update(id: string, data: Partial<CityType>): Promise<CityType>;
  delete(id: string): Promise<void>;
  createArea(cityId: string, areaData: { name: string; slug: string; zipcode: string }): Promise<any>;
}

export interface ICouponRepository {
  findAll(): Promise<CouponType[]>;
  findById(id: string): Promise<CouponType | null>;
  findByCode(code: string): Promise<CouponType | null>;
  create(data: any): Promise<CouponType>;
  update(id: string, data: Partial<CouponType>): Promise<CouponType>;
  delete(id: string): Promise<void>;
}

export interface ISubscriptionRepository {
  findAllPlans(): Promise<OwnerPlanType[]>;
  findPlanById(id: string): Promise<OwnerPlanType | null>;
  createPlan(data: any): Promise<OwnerPlanType>;
  updatePlan(id: string, data: Partial<OwnerPlanType>): Promise<OwnerPlanType>;
  deletePlan(id: string): Promise<void>;
}

export interface ISettingRepository {
  findAll(): Promise<ApplicationSettingType[]>;
  findByKey(key: string): Promise<ApplicationSettingType | null>;
  upsert(key: string, value: string, description?: string): Promise<ApplicationSettingType>;
}
