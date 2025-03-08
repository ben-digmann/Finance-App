import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All budget routes require authentication
router.use(authenticate);

// Placeholder GET route
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    budgets: []
  });
});

export default router;