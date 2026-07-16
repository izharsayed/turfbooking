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
import { prisma } from '../../database/index.js';

export class PrismaSportRepository implements ISportRepository {
  public async findAll(): Promise<SportType[]> {
    const list = await prisma.sport.findMany({ where: { deletedAt: null } });
    return list.map((s: any) => ({ ...s, description: s.description || null }));
  }

  public async findById(id: string): Promise<SportType | null> {
    const item = await prisma.sport.findUnique({ where: { id } });
    if (!item || item.deletedAt) return null;
    return { ...item, description: item.description || null };
  }

  public async create(data: { name: string; slug: string; description?: string }): Promise<SportType> {
    const item = await prisma.sport.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
      },
    });
    return { ...item, description: item.description || null };
  }

  public async update(id: string, data: Partial<SportType>): Promise<SportType> {
    const item = await prisma.sport.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        isActive: data.isActive,
        deletedAt: data.deletedAt,
      },
    });
    return { ...item, description: item.description || null };
  }

  public async delete(id: string): Promise<void> {
    await prisma.sport.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export class PrismaAmenityRepository implements IAmenityRepository {
  public async findAll(): Promise<AmenityType[]> {
    const list = await prisma.amenity.findMany({ where: { deletedAt: null } });
    return list.map((a: any) => ({ ...a, iconUrl: a.iconUrl || null, description: a.description || null }));
  }

  public async findById(id: string): Promise<AmenityType | null> {
    const item = await prisma.amenity.findUnique({ where: { id } });
    if (!item || item.deletedAt) return null;
    return { ...item, iconUrl: item.iconUrl || null, description: item.description || null };
  }

  public async create(data: { name: string; iconUrl?: string; description?: string }): Promise<AmenityType> {
    const item = await prisma.amenity.create({
      data: {
        name: data.name,
        iconUrl: data.iconUrl || null,
        description: data.description || null,
      },
    });
    return { ...item, iconUrl: item.iconUrl || null, description: item.description || null };
  }

  public async update(id: string, data: Partial<AmenityType>): Promise<AmenityType> {
    const item = await prisma.amenity.update({
      where: { id },
      data: {
        name: data.name,
        iconUrl: data.iconUrl,
        description: data.description,
        deletedAt: data.deletedAt,
      },
    });
    return { ...item, iconUrl: item.iconUrl || null, description: item.description || null };
  }

  public async delete(id: string): Promise<void> {
    await prisma.amenity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export class PrismaCityRepository implements ICityRepository {
  public async findAll(): Promise<CityType[]> {
    const list = await prisma.city.findMany({ where: { deletedAt: null } });
    return list;
  }

  public async findById(id: string): Promise<CityType | null> {
    const item = await prisma.city.findUnique({ where: { id } });
    if (!item || item.deletedAt) return null;
    return item;
  }

  public async create(data: { name: string; slug: string; state: string }): Promise<CityType> {
    const item = await prisma.city.create({
      data: {
        name: data.name,
        slug: data.slug,
        state: data.state,
      },
    });
    return item;
  }

  public async update(id: string, data: Partial<CityType>): Promise<CityType> {
    const item = await prisma.city.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        state: data.state,
        isActive: data.isActive,
        deletedAt: data.deletedAt,
      },
    });
    return item;
  }

  public async delete(id: string): Promise<void> {
    await prisma.city.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  public async createArea(cityId: string, areaData: { name: string; slug: string; zipcode: string }): Promise<any> {
    return prisma.area.create({
      data: {
        cityId,
        name: areaData.name,
        slug: areaData.slug,
        zipcode: areaData.zipcode,
      },
    });
  }
}

export class PrismaCouponRepository implements ICouponRepository {
  public async findAll(): Promise<CouponType[]> {
    const list = await prisma.coupon.findMany({ where: { deletedAt: null } });
    return list.map((c: any) => ({ ...c, description: c.description || null }));
  }

  public async findById(id: string): Promise<CouponType | null> {
    const item = await prisma.coupon.findUnique({ where: { id } });
    if (!item || item.deletedAt) return null;
    return { ...item, description: item.description || null };
  }

  public async findByCode(code: string): Promise<CouponType | null> {
    const item = await prisma.coupon.findUnique({ where: { code } });
    if (!item || item.deletedAt) return null;
    return { ...item, description: item.description || null };
  }

  public async create(data: any): Promise<CouponType> {
    const item = await prisma.coupon.create({
      data: {
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
      },
    });
    return { ...item, description: item.description || null };
  }

  public async update(id: string, data: Partial<CouponType>): Promise<CouponType> {
    const updateData: any = { ...data };
    if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate);
    const item = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });
    return { ...item, description: item.description || null };
  }

  public async delete(id: string): Promise<void> {
    await prisma.coupon.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  public async findAllPlans(): Promise<OwnerPlanType[]> {
    const list = await prisma.ownerPlan.findMany({ where: { deletedAt: null } });
    return list.map((p: any) => ({ ...p, features: p.features || null }));
  }

  public async findPlanById(id: string): Promise<OwnerPlanType | null> {
    const item = await prisma.ownerPlan.findUnique({ where: { id } });
    if (!item || item.deletedAt) return null;
    return { ...item, features: item.features || null };
  }

  public async createPlan(data: any): Promise<OwnerPlanType> {
    const item = await prisma.ownerPlan.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        durationDays: data.durationDays,
        maxTurfs: data.maxTurfs,
        isActive: data.isActive !== undefined ? data.isActive : true,
        features: data.features || null,
      },
    });
    return { ...item, features: item.features || null };
  }

  public async updatePlan(id: string, data: Partial<OwnerPlanType>): Promise<OwnerPlanType> {
    const item = await prisma.ownerPlan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        durationDays: data.durationDays,
        maxTurfs: data.maxTurfs,
        isActive: data.isActive,
        features: data.features,
        deletedAt: data.deletedAt,
      },
    });
    return { ...item, features: item.features || null };
  }

  public async deletePlan(id: string): Promise<void> {
    await prisma.ownerPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export class PrismaSettingRepository implements ISettingRepository {
  public async findAll(): Promise<ApplicationSettingType[]> {
    const list = await prisma.applicationSetting.findMany({ where: { deletedAt: null } });
    return list.map((s: any) => ({ ...s, description: s.description || null }));
  }

  public async findByKey(key: string): Promise<ApplicationSettingType | null> {
    const item = await prisma.applicationSetting.findUnique({ where: { key } });
    if (!item || item.deletedAt) return null;
    return { ...item, description: item.description || null };
  }

  public async upsert(key: string, value: string, description?: string): Promise<ApplicationSettingType> {
    const item = await prisma.applicationSetting.upsert({
      where: { key },
      update: { value, description: description || null },
      create: { key, value, description: description || null, isSystem: false },
    });
    return { ...item, description: item.description || null };
  }
}
