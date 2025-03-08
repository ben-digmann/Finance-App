import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';

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

// Placeholder route for registration
router.post('/register', validateRegister, (req: Request, res: Response) => {
  const { email, firstName, lastName } = req.body;
  
  res.status(201).json({
    user: {
      id: 1,
      email,
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    token: 'placeholder-jwt-token',
  });
});

// Placeholder route for login
router.post('/login', validateLogin, (req: Request, res: Response) => {
  const { email } = req.body;
  
  res.status(200).json({
    user: {
      id: 1,
      email,
      firstName: 'Demo',
      lastName: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    token: 'placeholder-jwt-token',
  });
});

// Placeholder route for getting current user
router.get('/me', authenticate, (req: Request, res: Response) => {
  res.status(200).json({
    user: {
      id: 1,
      email: 'user@example.com',
      firstName: 'Demo',
      lastName: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
});

export default router;