import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

// Get Plaid credentials from environment variables
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

// Log Plaid configuration (without secrets)
logger.info('Initializing Plaid client:', {
  environment: PLAID_ENV,
  hasClientId: !!PLAID_CLIENT_ID,
  hasSecret: !!PLAID_SECRET,
  apiVersion: '2020-09-14',
});

if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
  logger.error('Plaid credentials missing! Make sure PLAID_CLIENT_ID and PLAID_SECRET are set in your environment variables.');
}

// Plaid API configuration
const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
      'Plaid-Version': '2020-09-14',
    },
  },
});

// Create Plaid client
const plaidClient = new PlaidApi(configuration);

export { plaidClient };