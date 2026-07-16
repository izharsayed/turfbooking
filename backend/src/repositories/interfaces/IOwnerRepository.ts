export interface IOwnerRepository {
  getDashboardStats(ownerId: string): Promise<any>;
  listTurfs(ownerId: string): Promise<any[]>;
  listBookings(ownerId: string): Promise<any[]>;
  listPayments(ownerId: string): Promise<any[]>;
  listReviews(ownerId: string): Promise<any[]>;
  replyToReview(reviewId: string, reply: string): Promise<any>;
  
  // Employee Management
  listEmployees(ownerId: string): Promise<any[]>;
  createEmployee(ownerId: string, data: any): Promise<any>;
  updateEmployee(employeeId: string, data: any): Promise<any>;
  deleteEmployee(employeeId: string): Promise<any>;
}
