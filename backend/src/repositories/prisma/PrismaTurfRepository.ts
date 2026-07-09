import { Turf } from '../../shared/types/domain.js';
import { ITurfRepository } from '../interfaces/ITurfRepository.js';
import { prisma } from '../../database/index.js';

export class PrismaTurfRepository implements ITurfRepository {
  public async findById(id: string): Promise<Turf | null> {
    const turf = await prisma.turf.findUnique({ where: { id } });
    if (!turf) return null;
    return this.mapTurf(turf);
  }

  public async findAllActive(): Promise<Turf[]> {
    const turfs = await prisma.turf.findMany({ where: { isActive: true, deletedAt: null } });
    return turfs.map(this.mapTurf);
  }

  public async findByCity(city: string): Promise<Turf[]> {
    const turfs = await prisma.turf.findMany({ where: { city, isActive: true, deletedAt: null } });
    return turfs.map(this.mapTurf);
  }

  public async create(
    turfData: Omit<Turf, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'numReviews'>
  ): Promise<Turf> {
    const turf = await prisma.turf.create({
      data: {
        ownerId: turfData.ownerId,
        name: turfData.name,
        description: turfData.description,
        address: turfData.location.address,
        latitude: turfData.location.latitude,
        longitude: turfData.location.longitude,
        city: turfData.location.city,
        images: turfData.images,
        amenities: turfData.amenities,
        sports: turfData.sports,
        pricePerHour: turfData.pricePerHour,
        isActive: turfData.isActive,
      },
    });
    return this.mapTurf(turf);
  }

  public async update(id: string, turfData: Partial<Turf>): Promise<Turf> {
    const data: any = { ...turfData };
    if (turfData.location) {
      data.address = turfData.location.address;
      data.latitude = turfData.location.latitude;
      data.longitude = turfData.location.longitude;
      data.city = turfData.location.city;
      delete data.location;
    }
    const turf = await prisma.turf.update({
      where: { id },
      data,
    });
    return this.mapTurf(turf);
  }

  private mapTurf(t: any): Turf {
    return {
      id: t.id,
      ownerId: t.ownerId,
      name: t.name,
      description: t.description,
      location: {
        address: t.address,
        latitude: t.latitude,
        longitude: t.longitude,
        city: t.city,
      },
      images: t.images,
      amenities: t.amenities,
      sports: t.sports,
      pricePerHour: t.pricePerHour,
      rating: t.rating,
      numReviews: t.numReviews,
      isActive: t.isActive,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }
}
