import { Turf } from '../../shared/types/domain.js';
import { ITurfRepository } from '../interfaces/ITurfRepository.js';
import { firestoreDb } from '../../config/firebase.js';

export class FirebaseTurfRepository implements ITurfRepository {
  private get collection() {
    if (!firestoreDb) {
      throw new Error('Firestore Database is not initialized.');
    }
    return firestoreDb.collection('turfs');
  }

  public async findById(id: string): Promise<Turf | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapTurf(doc.id, doc.data());
  }

  public async findAllActive(): Promise<Turf[]> {
    const snap = await this.collection.where('isActive', '==', true).get();
    const list: Turf[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (!data.deletedAt) {
        list.push(this.mapTurf(doc.id, data));
      }
    });
    return list;
  }

  public async findByCity(city: string): Promise<Turf[]> {
    const snap = await this.collection
      .where('location.city', '==', city)
      .where('isActive', '==', true)
      .get();
    const list: Turf[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (!data.deletedAt) {
        list.push(this.mapTurf(doc.id, data));
      }
    });
    return list;
  }

  public async create(
    turfData: Omit<Turf, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'numReviews'>
  ): Promise<Turf> {
    const docRef = this.collection.doc();
    const newTurf = {
      ownerId: turfData.ownerId,
      name: turfData.name,
      description: turfData.description,
      location: turfData.location,
      images: turfData.images || ['https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&auto=format&fit=crop&q=60'],
      amenities: turfData.amenities || ['Washroom', 'Parking', 'Flood Lights'],
      sports: turfData.sports || [],
      pricePerHour: turfData.pricePerHour,
      isActive: turfData.isActive,
      rating: 0.0,
      numReviews: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      peakStartHour: turfData.peakStartHour || 18,
      peakEndHour: turfData.peakEndHour || 22,
      peakSurcharge: turfData.peakSurcharge || 300,
      weekendSurcharge: turfData.weekendSurcharge || 200,
      blockedSlots: turfData.blockedSlots || [],
    };
    await docRef.set(newTurf);
    return this.mapTurf(docRef.id, newTurf);
  }

  public async update(id: string, turfData: Partial<Turf>): Promise<Turf> {
    const docRef = this.collection.doc(id);
    const updateData: any = {
      ...turfData,
      updatedAt: new Date(),
    };
    await docRef.update(updateData);
    const doc = await docRef.get();
    return this.mapTurf(id, doc.data());
  }

  private mapTurf(id: string, data: any): Turf {
    return {
      id,
      ownerId: data.ownerId,
      name: data.name,
      description: data.description,
      location: data.location,
      images: data.images,
      amenities: data.amenities,
      sports: data.sports,
      pricePerHour: data.pricePerHour,
      rating: data.rating,
      numReviews: data.numReviews,
      isActive: data.isActive,
      createdAt: data.createdAt instanceof Date ? data.createdAt : data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt?.toDate?.() || new Date(),
      peakStartHour: data.peakStartHour,
      peakEndHour: data.peakEndHour,
      peakSurcharge: data.peakSurcharge,
      weekendSurcharge: data.weekendSurcharge,
      blockedSlots: data.blockedSlots,
    };
  }
}
