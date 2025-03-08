import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All category routes require authentication
router.use(authenticate);

// Placeholder GET route
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    categories: [
      'Housing',
      'Transportation',
      'Food',
      'Utilities',
      'Insurance',
      'Healthcare',
      'Debt Payments',
      'Entertainment',
      'Shopping',
      'Personal Care',
      'Education',
      'Travel',
      'Gifts & Donations',
      'Income',
      'Other'
    ]
  });
});

export default router;