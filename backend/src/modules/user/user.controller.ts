import { Response, NextFunction } from 'express';
import { userService } from './user.service.js';
import { sendResponse } from '../../shared/utils/response.js';
import { AuthenticatedRequest } from '../../middlewares/auth.js';
import { ValidationError } from '../../shared/utils/errors.js';

export class UserController {
  public getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await userService.getProfile(req.user!.id);
      return sendResponse(res, 200, true, 'User profile retrieved successfully', result);
    } catch (error) {
      return next(error);
    }
  };

  public updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await userService.updateProfile(req.user!.id, req.body);
      return sendResponse(res, 200, true, 'Profile updated successfully', result);
    } catch (error) {
      return next(error);
    }
  };

  public uploadAvatar = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }
      const avatarUrl = await userService.uploadAvatar(req.user!.id, req.file.buffer);
      return sendResponse(res, 200, true, 'Avatar uploaded successfully', { avatarUrl });
    } catch (error) {
      return next(error);
    }
  };

  public deleteAvatar = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await userService.deleteAvatar(req.user!.id);
      return sendResponse(res, 200, true, result.message);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /profile/account
   * Permanently anonymizes and soft-deletes the authenticated user's account (GDPR Art. 17).
   */
  public deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await userService.deleteAccount(req.user!.id);
      return sendResponse(res, 200, true, result.message);
    } catch (error) {
      return next(error);
    }
  };
}
export const userController = new UserController();
