import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError, asyncHandler } from './errorHandler';
import { logger } from '../utils/logger';
import { User } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authenticate = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Access token required', 401);
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      throw new ApiError('Access token required', 401);
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new ApiError('JWT secret not configured', 500);
      }

      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Fetch user from database to ensure they still exist
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new ApiError('User not found', 401);
      }
      
      req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      };

      logger.info('User authenticated', { userId: req.user.id });
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError('Invalid token', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError('Token expired', 401);
      }
      throw error;
    }
  }
);

export const optionalAuth = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next();
      }

      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Optionally fetch user from database
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      }

      logger.info('User optionally authenticated', { userId: req.user?.id });
    } catch (error) {
      // Ignore authentication errors for optional auth
      logger.warn('Optional authentication failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
    
    next();
  }
);