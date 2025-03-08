import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { User } from '../models';
import { logger } from '../utils/logger';

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_replace_in_production';

// Interface for decoded token
interface DecodedToken {
  id: number;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Authentication middleware to protect routes
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // DEVELOPMENT MODE BYPASS - Remove in production!
    if (process.env.NODE_ENV === 'development') {
      // Add a mock user to the request for development
      (req as any).user = {
        id: 1,
        email: 'demo@example.com',
      };
      logger.debug('DEV MODE: Authentication bypassed, using mock user');
      return next();
    }
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Check if user exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Attach user to request
    (req as any).user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validation middleware for request body
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const errors = error.details.map((detail: any) => detail.message);
      return res.status(400).json({ errors });
    }
    next();
  };
};