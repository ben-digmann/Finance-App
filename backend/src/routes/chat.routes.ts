import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { askFinanceQuestion } from '../controllers/chat.controller';

const router = express.Router();
router.use(authenticate);
router.post('/', askFinanceQuestion);

export default router;
