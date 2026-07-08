import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../shared/types/domain.js';
import { AuthenticationError } from '../shared/utils/errors.js';
import { verifyAccessToken } from '../shared/utils/token.js';
import { sessionManager } from '../shared/utils/sessionManager.js';
import { userRepository } from '../repositories/index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
  tokenJti?: string;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization token required');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      throw new AuthenticationError('Invalid or expired access token');
    }

    // Check if token JTI is blacklisted (revoked via logout)
    if (decoded.jti && await sessionManager.isAccessTokenBlacklisted(decoded.jti)) {
      throw new AuthenticationError('Token has been revoked');
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new AuthenticationError('User no longer exists');
    }

    if (!user.isActive) {
      throw new AuthenticationError('User account is currently inactive or blocked');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    req.tokenJti = decoded.jti;

    return next();
  } catch (error) {
    return next(error);
  }
};
