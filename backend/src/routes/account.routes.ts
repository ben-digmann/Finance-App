import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All account routes require authentication
router.use(authenticate);

// Placeholder GET route for all accounts
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    accounts: [],
    totalBalance: 0,
    totalAvailableBalance: 0
  });
});

// Placeholder GET route for a specific account
router.get('/:id', (req: Request, res: Response) => {
  res.status(200).json({
    account: null
  });
});

export default router;