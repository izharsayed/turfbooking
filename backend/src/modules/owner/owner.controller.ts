import { Response, NextFunction } from 'express';
import { ownerService } from './owner.service.js';
import { sendResponse } from '../../shared/utils/response.js';
import { AuthenticatedRequest } from '../../middlewares/auth.js';

export class OwnerController {
  // --- Dashboard ---
  public getDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await ownerService.getDashboardStats(req.user!.id);
      return sendResponse(res, 200, true, 'Dashboard analytics retrieved successfully', stats);
    } catch (error) {
      return next(error);
    }
  };

  // --- Profile ---
  public getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await ownerService.getProfile(req.user!.id);
      return sendResponse(res, 200, true, 'Owner profile retrieved successfully', profile);
    } catch (error) {
      return next(error);
    }
  };

  public updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await ownerService.updateProfile(req.user!.id, req.body);
      return sendResponse(res, 200, true, 'Owner profile updated successfully', profile);
    } catch (error) {
      return next(error);
    }
  };

  // --- Turfs ---
  public getTurfs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const turfs = await ownerService.getTurfs(req.user!.id);
      return sendResponse(res, 200, true, 'Turfs list retrieved successfully', turfs);
    } catch (error) {
      return next(error);
    }
  };

  public createTurf = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const turf = await ownerService.createTurf(req.user!.id, req.body);
      return sendResponse(res, 201, true, 'Turf created successfully', turf);
    } catch (error) {
      return next(error);
    }
  };

  public updateTurf = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const turf = await ownerService.updateTurf(req.user!.id, req.params.id, req.body);
      return sendResponse(res, 200, true, 'Turf updated successfully', turf);
    } catch (error) {
      return next(error);
    }
  };

  public deleteTurf = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await ownerService.deleteTurf(req.user!.id, req.params.id);
      return sendResponse(res, 200, true, 'Turf soft-deleted successfully');
    } catch (error) {
      return next(error);
    }
  };

  // --- Bookings ---
  public getBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const list = await ownerService.getBookings(req.user!.id);
      return sendResponse(res, 200, true, 'Bookings list retrieved successfully', list);
    } catch (error) {
      return next(error);
    }
  };

  public createOfflineBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await ownerService.createOfflineBooking(req.user!.id, req.body);
      return sendResponse(res, 201, true, 'Offline booking created successfully', booking);
    } catch (error) {
      return next(error);
    }
  };

  public cancelBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await ownerService.cancelBooking(req.user!.id, req.params.id);
      return sendResponse(res, 200, true, 'Booking cancelled successfully', result);
    } catch (error) {
      return next(error);
    }
  };

  public confirmBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await ownerService.confirmBooking(req.user!.id, req.params.id);
      return sendResponse(res, 200, true, 'Booking confirmed successfully', result);
    } catch (error) {
      return next(error);
    }
  };

  // --- Payments ---
  public getPayments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const list = await ownerService.getPayments(req.user!.id);
      return sendResponse(res, 200, true, 'Payments transactions retrieved successfully', list);
    } catch (error) {
      return next(error);
    }
  };

  // --- Reviews ---
  public getReviews = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const list = await ownerService.getReviews(req.user!.id);
      return sendResponse(res, 200, true, 'Reviews retrieved successfully', list);
    } catch (error) {
      return next(error);
    }
  };

  public replyToReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await ownerService.replyToReview(req.user!.id, req.params.id, req.body.reply);
      return sendResponse(res, 200, true, 'Reply posted to review successfully', result);
    } catch (error) {
      return next(error);
    }
  };

  // --- Coupons ---
  public getCoupons = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const list = await ownerService.getCoupons(req.user!.id);
      return sendResponse(res, 200, true, 'Coupons list retrieved successfully', list);
    } catch (error) {
      return next(error);
    }
  };

  public createCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const coupon = await ownerService.createCoupon(req.user!.id, req.body);
      return sendResponse(res, 201, true, 'Coupon created successfully', coupon);
    } catch (error) {
      return next(error);
    }
  };

  public updateCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const coupon = await ownerService.updateCoupon(req.user!.id, req.params.id, req.body);
      return sendResponse(res, 200, true, 'Coupon updated successfully', coupon);
    } catch (error) {
      return next(error);
    }
  };

  public deleteCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await ownerService.deleteCoupon(req.user!.id, req.params.id);
      return sendResponse(res, 200, true, 'Coupon deleted successfully');
    } catch (error) {
      return next(error);
    }
  };

  // --- Reports & Exports ---
  public getReports = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const reportType = (req.query.type as string) || 'revenue';
      const format = (req.query.format as 'csv' | 'pdf') || 'csv';
      const result = await ownerService.exportReport(req.user!.id, reportType, format);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.data);
    } catch (error) {
      return next(error);
    }
  };
}
export const ownerController = new OwnerController();
