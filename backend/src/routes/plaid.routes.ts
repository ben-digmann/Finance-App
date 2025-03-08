import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { 
  createLinkToken, 
  exchangePublicToken, 
  manualTransactionSync,
  handlePlaidWebhook
} from '../controllers/plaid.controller';

const router = express.Router();

// Log when routes are initialized
logger.info('Initializing Plaid routes');

// Webhook endpoint - no authentication for Plaid callbacks
router.post('/webhook', handlePlaidWebhook);

// Create a test route to verify API is working
router.get('/test', (req: Request, res: Response) => {
  logger.debug('Plaid test route accessed');
  res.status(200).json({ status: 'ok', message: 'Plaid routes are working' });
});

// All other Plaid routes require authentication
router.use(authenticate);

// Create a link token for Plaid Link initialization
router.get('/create-link-token', (req: Request, res: Response, next: NextFunction) => {
  logger.debug('Create link token route accessed');
  return createLinkToken(req, res, next);
});

// Exchange a public token for an access token and item ID
router.post(
  '/exchange-public-token',
  [body('publicToken').notEmpty().withMessage('Public token is required')],
  (req: Request, res: Response, next: NextFunction) => {
    logger.debug('Exchange public token route accessed', { body: req.body });
    return exchangePublicToken(req, res, next);
  }
);

// Manually sync transactions for a user's accounts
router.post('/sync-transactions', manualTransactionSync);

export default router;