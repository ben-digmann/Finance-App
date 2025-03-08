import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_replace_in_production';

// Generate a JWT token for a user
const generateToken = (user: any): string => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user with this email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Create the new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
    });

    // Generate JWT token
    const token = generateToken(user);

    // Update last login time
    await user.update({ lastLogin: new Date() });

    // Return user and token (excluding password)
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login a user
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Find user by email with password included
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = generateToken(user);

    // Update last login time
    await user.update({ lastLogin: new Date() });

    // Return user and token (excluding password)
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user information
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // User is already attached to req by auth middleware
    const userId = (req as any).user.id;
    
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};