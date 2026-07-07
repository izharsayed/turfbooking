import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { AuthorizationError } from '../shared/utils/errors.js';
import { UserRole } from '@turf-booking/types';

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError('Forbidden: Access is denied');
    }

    return next();
  };
};
