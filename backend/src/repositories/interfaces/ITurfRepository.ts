import { Turf } from '../../shared/types/domain.js';

export interface ITurfRepository {
  findById(id: string): Promise<Turf | null>;
  findAllActive(): Promise<Turf[]>;
  findByCity(city: string): Promise<Turf[]>;
  create(turfData: Omit<Turf, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'numReviews'>): Promise<Turf>;
  update(id: string, turfData: Partial<Turf>): Promise<Turf>;
}
