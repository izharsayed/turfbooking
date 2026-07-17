import {
  adminRepository,
  sportRepository,
  amenityRepository,
  cityRepository,
  couponRepository,
  subscriptionRepository,
  settingRepository,
  userRepository,
} from '../../repositories/index.js';
import { NotFoundError } from '../../shared/utils/errors.js';

export class AdminService {
  // --- Dashboard & Analytics ---
  public async getDashboardStats() {
    return adminRepository.getDashboardStats();
  }

  public async getAuditLogs() {
    return adminRepository.listAuditLogs();
  }

  // --- User & Owner Controls ---
  public async getUsers(filters: any) {
    return adminRepository.listUsers(filters);
  }

  public async updateUserStatus(userId: string, isActive: boolean) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return userRepository.update(userId, { isActive });
  }

  public async deleteUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return userRepository.update(userId, { deletedAt: new Date() });
  }

  public async getOwners() {
    return adminRepository.listOwners();
  }

  public async updateOwnerApproval(ownerId: string, status: any, rejectionReason?: string) {
    const user = await userRepository.findById(ownerId);
    if (!user) throw new NotFoundError('Owner user not found');
    return adminRepository.updateOwnerApproval(ownerId, status, rejectionReason);
  }

  public async updateOwnerPayment(
    ownerId: string,
    status: 'PENDING' | 'PAID',
    paymentEntry?: { amount: number; type: string; paymentMethod: string; transactionId?: string }
  ) {
    const user = await userRepository.findById(ownerId);
    if (!user) throw new NotFoundError('Owner user not found');
    return adminRepository.updateOwnerPayment(ownerId, status, paymentEntry);
  }

  // --- Turf Controls ---
  public async updateTurfStatus(turfId: string, status: { isActive?: boolean; isFeatured?: boolean }) {
    // (In future we can verify turf existence via turfRepository)
    return adminRepository.updateTurfStatus(turfId, status);
  }

  // --- Sports CRUD ---
  public async getSports() {
    return sportRepository.findAll();
  }

  public async createSport(data: any) {
    return sportRepository.create(data);
  }

  public async updateSport(id: string, data: any) {
    const sport = await sportRepository.findById(id);
    if (!sport) throw new NotFoundError('Sport not found');
    return sportRepository.update(id, data);
  }

  public async deleteSport(id: string) {
    const sport = await sportRepository.findById(id);
    if (!sport) throw new NotFoundError('Sport not found');
    return sportRepository.delete(id);
  }

  // --- Amenities CRUD ---
  public async getAmenities() {
    return amenityRepository.findAll();
  }

  public async createAmenity(data: any) {
    return amenityRepository.create(data);
  }

  public async updateAmenity(id: string, data: any) {
    const amenity = await amenityRepository.findById(id);
    if (!amenity) throw new NotFoundError('Amenity not found');
    return amenityRepository.update(id, data);
  }

  public async deleteAmenity(id: string) {
    const amenity = await amenityRepository.findById(id);
    if (!amenity) throw new NotFoundError('Amenity not found');
    return amenityRepository.delete(id);
  }

  // --- Cities CRUD ---
  public async getCities() {
    return cityRepository.findAll();
  }

  public async createCity(data: any) {
    return cityRepository.create(data);
  }

  public async updateCity(id: string, data: any) {
    const city = await cityRepository.findById(id);
    if (!city) throw new NotFoundError('City not found');
    return cityRepository.update(id, data);
  }

  public async deleteCity(id: string) {
    const city = await cityRepository.findById(id);
    if (!city) throw new NotFoundError('City not found');
    return cityRepository.delete(id);
  }

  public async createArea(cityId: string, data: any) {
    const city = await cityRepository.findById(cityId);
    if (!city) throw new NotFoundError('City not found');
    return cityRepository.createArea(cityId, data);
  }

  // --- Coupons CRUD ---
  public async getCoupons() {
    return couponRepository.findAll();
  }

  public async createCoupon(data: any) {
    return couponRepository.create(data);
  }

  public async updateCoupon(id: string, data: any) {
    const coupon = await couponRepository.findById(id);
    if (!coupon) throw new NotFoundError('Coupon not found');
    return couponRepository.update(id, data);
  }

  public async deleteCoupon(id: string) {
    const coupon = await couponRepository.findById(id);
    if (!coupon) throw new NotFoundError('Coupon not found');
    return couponRepository.delete(id);
  }

  // --- Subscription Plans CRUD ---
  public async getPlans() {
    return subscriptionRepository.findAllPlans();
  }

  public async createPlan(data: any) {
    return subscriptionRepository.createPlan(data);
  }

  public async updatePlan(id: string, data: any) {
    const plan = await subscriptionRepository.findPlanById(id);
    if (!plan) throw new NotFoundError('Subscription plan not found');
    return subscriptionRepository.updatePlan(id, data);
  }

  public async deletePlan(id: string) {
    const plan = await subscriptionRepository.findPlanById(id);
    if (!plan) throw new NotFoundError('Subscription plan not found');
    return subscriptionRepository.deletePlan(id);
  }

  // --- Settings CRUD ---
  public async getSettings() {
    return settingRepository.findAll();
  }

  public async updateSetting(key: string, value: string, description?: string) {
    return settingRepository.upsert(key, value, description);
  }

  // --- Reports & Exports ---
  public async exportReport(reportType: string, format: 'csv' | 'pdf') {
    let reportData = '';
    
    if (reportType === 'users') {
      const users = await adminRepository.listUsers({});
      reportData = 'id,name,email,phone,role,isActive\n' + 
        users.map(u => `"${u.id}","${u.name || ''}","${u.email || ''}","${u.phone || ''}","${u.role || ''}",${u.isActive}`).join('\n');
    } else if (reportType === 'owners') {
      const owners = await adminRepository.listOwners();
      reportData = 'id,name,email,companyName,status\n' + 
        owners.map(o => `"${o.id}","${o.name || ''}","${o.email || ''}","${o.companyName || ''}","${o.status || ''}"`).join('\n');
    } else { // default to bookings / revenue
      reportData = 'id,turfName,userId,date,timeSlot,amount,status\n';
      const { firestoreDb } = await import('../../config/firebase.js');
      if (firestoreDb) {
        const snap = await firestoreDb.collection('bookings').get();
        const bookings: any[] = [];
        snap.forEach(doc => {
          const d = doc.data();
          bookings.push({ id: doc.id, ...d });
        });
        reportData += bookings.map(b => `"${b.id}","${b.turfName || 'Arena Turf'}","${b.userId || ''}","${b.date || ''}","${b.time || b.timeSlot || ''}",${b.amount || b.totalAmount || 0},"${b.status || ''}"`).join('\n');
      }
    }

    return {
      filename: `${reportType}_report_${Date.now()}.${format}`,
      contentType: format === 'csv' ? 'text/csv' : 'application/pdf',
      data: Buffer.from(reportData, 'utf-8'),
    };
  }
}
export const adminService = new AdminService();
