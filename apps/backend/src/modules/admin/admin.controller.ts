import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';
import { sendResponse } from '../../shared/utils/response.js';
import { AuthenticatedRequest } from '../../middlewares/auth.js';

export class AdminController {
  // --- Dashboard & Logs ---
  public getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await adminService.getDashboardStats();
      return sendResponse(res, 200, true, 'Dashboard analytics fetched successfully', stats);
    } catch (error) {
      return next(error);
    }
  };

  public getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await adminService.getAuditLogs();
      return sendResponse(res, 200, true, 'Audit logs retrieved successfully', logs);
    } catch (error) {
      return next(error);
    }
  };

  // --- Users & Owners ---
  public getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await adminService.getUsers(req.query);
      return sendResponse(res, 200, true, 'Users list retrieved successfully', list);
    } catch (error) {
      return next(error);
    }
  };

  public blockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await adminService.updateUserStatus(req.params.id, false);
      return sendResponse(res, 200, true, 'User blocked successfully', user);
    } catch (error) {
      return next(error);
    }
  };

  public unblockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await adminService.updateUserStatus(req.params.id, true);
      return sendResponse(res, 200, true, 'User unblocked successfully', user);
    } catch (error) {
      return next(error);
    }
  };

  public deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminService.deleteUser(req.params.id);
      return sendResponse(res, 200, true, 'User soft-deleted successfully');
    } catch (error) {
      return next(error);
    }
  };

  public getOwners = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await adminService.getOwners();
      return sendResponse(res, 200, true, 'Turf owners list retrieved successfully', list);
    } catch (error) {
      return next(error);
    }
  };

  public approveOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await adminService.updateOwnerApproval(req.params.id, 'APPROVED');
      return sendResponse(res, 200, true, 'Owner registration approved successfully', result);
    } catch (error) {
      return next(error);
    }
  };

  public rejectOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await adminService.updateOwnerApproval(req.params.id, 'REJECTED', req.body.rejectionReason);
      return sendResponse(res, 200, true, 'Owner registration rejected successfully', result);
    } catch (error) {
      return next(error);
    }
  };

  // --- Turfs ---
  public updateTurfStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await adminService.updateTurfStatus(req.params.id, req.body);
      return sendResponse(res, 200, true, 'Turf status updated successfully', result);
    } catch (error) {
      return next(error);
    }
  };

  // --- Sports ---
  public getSports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await adminService.getSports();
      return sendResponse(res, 200, true, 'Sports taxonomy retrieved successfully', list);
    } catch (error) {
      return next(error);
    }
  };

  public createSport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sport = await adminService.createSport(req.body);
      return sendResponse(res, 201, true, 'Sport created successfully', sport);
    } catch (error) {
      return next(error);
    }
  };

  public updateSport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sport = await adminService.updateSport(req.params.id, req.body);
      return sendResponse(res, 200, true, 'Sport updated successfully', sport);
    } catch (error) {
      return next(error);
    }
  };

  public deleteSport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminService.deleteSport(req.params.id);
      return sendResponse(res, 200, true, 'Sport deleted successfully');
    } catch (error) {
      return next(error);
    }
  };

  // --- Amenities ---
  public getAmenities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await adminService.getAmenities();
      return sendResponse(res, 200, true, 'Amenities retrieved successfully', list);
    } catch (error) {
      return next(error);
    }
  };

  public createAmenity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const amenity = await adminService.createAmenity(req.body);
      return sendResponse(res, 201, true, 'Amenity created successfully', amenity);
    } catch (error) {
      return next(error);
    }
  };

  public updateAmenity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const amenity = await adminService.updateAmenity(req.params.id, req.body);
      return sendResponse(res, 200, true, 'Amenity updated successfully', amenity);
    } catch (error) {
      return next(error);
    }
  };

  public deleteAmenity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminService.deleteAmenity(req.params.id);
      return sendResponse(res, 200, true, 'Amenity deleted successfully');
    } catch (error) {
      return next(error);
    }
  };

  // --- Cities ---
  public getCities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await adminService.getCities();
      return sendResponse(res, 200, true, 'Cities taxonomy retrieved successfully', list);
    } catch (error) {
      return next(error);
    }
  };

  public createCity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const city = await adminService.createCity(req.body);
      return sendResponse(res, 201, true, 'City created successfully', city);
    } catch (error) {
      return next(error);
    }
  };

  public updateCity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const city = await adminService.updateCity(req.params.id, req.body);
      return sendResponse(res, 200, true, 'City updated successfully', city);
    } catch (error) {
      return next(error);
    }
  };

  public deleteCity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminService.deleteCity(req.params.id);
      return sendResponse(res, 200, true, 'City deleted successfully');
    } catch (error) {
      return next(error);
    }
  };

  public createArea = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const area = await adminService.createArea(req.params.id, req.body);
      return sendResponse(res, 201, true, 'Area created successfully under city', area);
    } catch (error) {
      return next(error);
    }
  };

  // --- Coupons ---
  public getCoupons = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await adminService.getCoupons();
      return sendResponse(res, 200, true, 'Coupons list retrieved successfully', list);
    } catch (error) {
      return next(error);
    }
  };

  public createCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const coupon = await adminService.createCoupon(req.body);
      return sendResponse(res, 201, true, 'Coupon created successfully', coupon);
    } catch (error) {
      return next(error);
    }
  };

  public updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const coupon = await adminService.updateCoupon(req.params.id, req.body);
      return sendResponse(res, 200, true, 'Coupon updated successfully', coupon);
    } catch (error) {
      return next(error);
    }
  };

  public deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminService.deleteCoupon(req.params.id);
      return sendResponse(res, 200, true, 'Coupon deleted successfully');
    } catch (error) {
      return next(error);
    }
  };

  // --- Subscription Plans ---
  public getPlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await adminService.getPlans();
      return sendResponse(res, 200, true, 'Subscription plans retrieved successfully', list);
    } catch (error) {
      return next(error);
    }
  };

  public createPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await adminService.createPlan(req.body);
      return sendResponse(res, 201, true, 'Subscription plan created successfully', plan);
    } catch (error) {
      return next(error);
    }
  };

  public updatePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await adminService.updatePlan(req.params.id, req.body);
      return sendResponse(res, 200, true, 'Subscription plan updated successfully', plan);
    } catch (error) {
      return next(error);
    }
  };

  public deletePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminService.deletePlan(req.params.id);
      return sendResponse(res, 200, true, 'Subscription plan deleted successfully');
    } catch (error) {
      return next(error);
    }
  };

  // --- Platform Settings ---
  public getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await adminService.getSettings();
      return sendResponse(res, 200, true, 'Global settings retrieved successfully', list);
    } catch (error) {
      return next(error);
    }
  };

  public updateSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const setting = await adminService.updateSetting(req.params.key, req.body.value, req.body.description);
      return sendResponse(res, 200, true, 'Setting updated successfully', setting);
    } catch (error) {
      return next(error);
    }
  };

  // --- Reports & Exports ---
  public getReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportType = (req.query.type as string) || 'revenue';
      const format = (req.query.format as 'csv' | 'pdf') || 'csv';
      
      const result = await adminService.exportReport(reportType, format);
      
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.data);
    } catch (error) {
      return next(error);
    }
  };
}
export const adminController = new AdminController();
