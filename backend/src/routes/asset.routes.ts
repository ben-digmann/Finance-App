import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All asset routes require authentication
router.use(authenticate);

// Placeholder GET route
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    assets: [],
    totalAssetValue: 0
  });
});

export default router;