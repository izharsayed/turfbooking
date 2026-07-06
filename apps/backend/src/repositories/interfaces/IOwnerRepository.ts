export interface IOwnerRepository {
  getDashboardStats(ownerId: string): Promise<any>;
  listTurfs(ownerId: string): Promise<any[]>;
  listBookings(ownerId: string): Promise<any[]>;
  listPayments(ownerId: string): Promise<any[]>;
  listReviews(ownerId: string): Promise<any[]>;
  replyToReview(reviewId: string, reply: string): Promise<any>;
}
