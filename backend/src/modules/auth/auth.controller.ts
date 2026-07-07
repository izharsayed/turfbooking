import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendResponse } from '../../shared/utils/response.js';
import { AuthenticatedRequest } from '../../middlewares/auth.js';

export class AuthController {
  private authService = new AuthService();

  public registerCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.registerCustomer(req.body);
      return sendResponse(res, 201, true, 'User registered successfully. Verification link sent to email.', result.user);
    } catch (error) {
      return next(error);
    }
  };

  public registerOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.registerOwner(req.body);
      return sendResponse(res, 201, true, result.message, result.user);
    } catch (error) {
      return next(error);
    }
  };

  public verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.query.token as string;
      const result = await this.authService.verifyEmail(token);
      return sendResponse(res, 200, true, result.message);
    } catch (error) {
      return next(error);
    }
  };

  public resendVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.resendVerification(req.body.email);
      return sendResponse(res, 200, true, result.message);
    } catch (error) {
      return next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deviceMetadata = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      };
      const result = await this.authService.login(req.body.email, req.body.password, deviceMetadata);
      return sendResponse(res, 200, true, 'Login successful', {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      return next(error);
    }
  };

  public sendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.sendOtp(req.body.phone);
      return sendResponse(res, 200, true, result.message);
    } catch (error) {
      return next(error);
    }
  };

  public verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deviceMetadata = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      };
      const result = await this.authService.verifyOtp(req.body.phone, req.body.code, deviceMetadata);
      return sendResponse(res, 200, true, 'OTP verified successfully. Login success.', {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      return next(error);
    }
  };

  public googleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deviceMetadata = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      };
      const result = await this.authService.googleLogin(req.body.idToken, deviceMetadata);
      return sendResponse(res, 200, true, 'Google authentication successful', {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      return next(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deviceMetadata = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      };
      const result = await this.authService.refreshSession(req.body.refreshToken, deviceMetadata);
      return sendResponse(res, 200, true, 'Session refreshed successfully', {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      return next(error);
    }
  };

  public logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.logout(req.user!.id, req.tokenJti!);
      return sendResponse(res, 200, true, result.message);
    } catch (error) {
      return next(error);
    }
  };

  public logoutAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.logoutAll(req.user!.id);
      return sendResponse(res, 200, true, result.message);
    } catch (error) {
      return next(error);
    }
  };

  public forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.forgotPassword(req.body.email);
      return sendResponse(res, 200, true, result.message);
    } catch (error) {
      return next(error);
    }
  };

  public resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.query.token as string || req.body.token;
      const result = await this.authService.resetPassword(token, req.body.password);
      return sendResponse(res, 200, true, result.message);
    } catch (error) {
      return next(error);
    }
  };

  public changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
      return sendResponse(res, 200, true, result.message);
    } catch (error) {
      return next(error);
    }
  };
}
