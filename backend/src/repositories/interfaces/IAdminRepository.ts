export interface IAdminRepository {
  getDashboardStats(): Promise<any>;
  listUsers(filters: {
    role?: string;
    isActive?: boolean;
    cityId?: string;
    search?: string;
  }): Promise<any[]>;
  listOwners(): Promise<any[]>;
  updateOwnerApproval(
    ownerId: string,
    status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ): Promise<any>;
  updateTurfStatus(
    turfId: string,
    status: { isActive?: boolean; isFeatured?: boolean }
  ): Promise<any>;
  updateOwnerPayment(
    ownerId: string,
    status: 'PENDING' | 'PAID',
    paymentEntry?: { amount: number; type: string; paymentMethod: string; transactionId?: string }
  ): Promise<any>;
  listAuditLogs(): Promise<any[]>;
  createAuditLog(log: {
    userId?: string;
    action: string;
    tableName: string;
    recordId: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<any>;
}
