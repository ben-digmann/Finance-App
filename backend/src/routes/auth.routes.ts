import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import {
  register as registerController,
  login as loginController,
  getCurrentUser,
} from '../controllers/auth.controller';

const router = express.Router();

// Validation middleware for register
const validateRegister = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain a number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain a special character'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
];

// Validation middleware for login
const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register a new user
router.post(
  '/register',
  validateRegister,
  (req: Request, res: Response, next: NextFunction) => {
    return registerController(req, res, next);
  }
);

// Log in a user
router.post(
  '/login',
  validateLogin,
  (req: Request, res: Response, next: NextFunction) => {
    return loginController(req, res, next);
  }
);

// Get the currently authenticated user
router.get(
  '/me',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    return getCurrentUser(req, res, next);
  }
);

export default router;