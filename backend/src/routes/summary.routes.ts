import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getFinancialSummary } from '../controllers/summary.controller';

const router = express.Router();
router.use(authenticate);
router.get('/', getFinancialSummary);

export default router;
