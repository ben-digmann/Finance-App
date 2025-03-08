import request from 'supertest';
import app from '../../src/server';
import { User, Account, Transaction } from '../../src/models';
import { sequelize } from '../../src/config/database';
import { plaidClient } from '../../src/config/plaid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Mock Plaid API
jest.mock('../../src/config/plaid', () => ({
  plaidClient: {
    linkTokenCreate: jest.fn(),
    itemPublicTokenExchange: jest.fn(),
    accountsGet: jest.fn(),
    transactionsSync: jest.fn(),
  },
}));

// Mock OpenAI categorization
jest.mock('../../src/config/openai', () => ({
  classifyTransaction: jest.fn().mockImplementation(() => Promise.resolve('Food & Dining')),
  openai: {},
}));

describe('Plaid Integration', () => {
  let authToken: string;
  let userId: number;
  
  beforeAll(async () => {
    // Sync database - force true will drop tables first
    await sequelize.sync({ force: true });
    
    // Create a test user
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const user = await User.create({
      email: 'plaidtest@example.com',
      password: hashedPassword,
      firstName: 'Plaid',
      lastName: 'Test',
    });
    
    userId = user.id;
    
    // Generate JWT for the user
    const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_replace_in_production';
    authToken = jwt.sign(
      { id: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '24h' }
    );
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('GET /api/plaid/create-link-token', () => {
    it('should create a link token successfully', async () => {
      // Mock Plaid API response
      const mockLinkToken = 'link-sandbox-12345';
      (plaidClient.linkTokenCreate as jest.Mock).mockResolvedValue({
        data: {
          link_token: mockLinkToken,
          expiration: '2099-01-01T00:00:00Z',
        },
      });
      
      // Make API request
      const response = await request(app)
        .get('/api/plaid/create-link-token')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify response
      expect(response.body).toHaveProperty('linkToken', mockLinkToken);
      expect(response.body).toHaveProperty('expiration');
      
      // Verify Plaid API was called correctly
      expect(plaidClient.linkTokenCreate).toHaveBeenCalledWith({
        user: {
          client_user_id: userId.toString(),
        },
        client_name: 'Finance App',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
      });
    });
    
    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/api/plaid/create-link-token')
        .expect(401);
    });
  });
  
  describe('POST /api/plaid/exchange-public-token', () => {
    it('should exchange public token and store account information', async () => {
      // Mock Plaid API responses
      const mockAccessToken = 'access-sandbox-12345';
      const mockItemId = 'item-sandbox-12345';
      
      (plaidClient.itemPublicTokenExchange as jest.Mock).mockResolvedValue({
        data: {
          access_token: mockAccessToken,
          item_id: mockItemId,
        },
      });
      
      (plaidClient.accountsGet as jest.Mock).mockResolvedValue({
        data: {
          accounts: [
            {
              account_id: 'account-sandbox-12345',
              name: 'Checking Account',
              official_name: 'Premium Checking',
              type: 'depository',
              subtype: 'checking',
              mask: '1234',
              balances: {
                current: 1000,
                available: 900,
                iso_currency_code: 'USD',
              },
            },
          ],
          item: {
            item_id: mockItemId,
          },
        },
      });
      
      (plaidClient.transactionsSync as jest.Mock).mockResolvedValue({
        data: {
          added: [
            {
              transaction_id: 'tx-1',
              account_id: 'account-sandbox-12345',
              amount: 75.50,
              date: '2023-01-15',
              name: 'GROCERY STORE',
              category: ['Food and Drink', 'Groceries'],
              pending: false,
              payment_channel: 'in store',
              merchant_name: 'Grocery Store Inc.',
            },
          ],
          modified: [],
          removed: [],
          has_more: false,
          next_cursor: 'cursor-123',
        },
      });
      
      // Make API request
      const response = await request(app)
        .post('/api/plaid/exchange-public-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          publicToken: 'public-sandbox-12345',
        })
        .expect(200);
      
      // Verify response
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accountsAdded', 1);
      
      // Verify account was saved to database
      const accounts = await Account.findAll({ where: { userId } });
      expect(accounts.length).toBe(1);
      expect(accounts[0].plaidItemId).toBe(mockItemId);
      expect(accounts[0].plaidAccountId).toBe('account-sandbox-12345');
      expect(accounts[0].name).toBe('Checking Account');
      expect(accounts[0].type).toBe('depository');
      expect(Number(accounts[0].currentBalance)).toBe(1000);
      
      // Verify transaction was saved to database
      const transactions = await Transaction.findAll({ where: { userId } });
      expect(transactions.length).toBe(1);
      expect(transactions[0].plaidTransactionId).toBe('tx-1');
      expect(transactions[0].name).toBe('GROCERY STORE');
      expect(Number(transactions[0].amount)).toBe(75.50);
      expect(transactions[0].llmCategory).toBe('Food & Dining');
    });
    
    it('should handle invalid public token gracefully', async () => {
      // Mock Plaid API error
      (plaidClient.itemPublicTokenExchange as jest.Mock).mockRejectedValue({
        response: {
          data: {
            error_code: 'INVALID_PUBLIC_TOKEN',
            error_message: 'The public token is invalid',
          },
        },
      });
      
      // Make API request
      const response = await request(app)
        .post('/api/plaid/exchange-public-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          publicToken: 'invalid-token',
        })
        .expect(400);
      
      // Verify error response
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('INVALID_PUBLIC_TOKEN');
    });
    
    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/api/plaid/exchange-public-token')
        .send({
          publicToken: 'public-sandbox-12345',
        })
        .expect(401);
    });
  });
  
  describe('POST /api/plaid/sync-transactions', () => {
    it('should sync transactions for all accounts', async () => {
      // Mock Plaid API response
      (plaidClient.transactionsSync as jest.Mock).mockResolvedValue({
        data: {
          added: [
            {
              transaction_id: 'tx-2',
              account_id: 'account-sandbox-12345',
              amount: 25.99,
              date: '2023-01-16',
              name: 'RESTAURANT PAYMENT',
              category: ['Food and Drink', 'Restaurants'],
              pending: false,
              payment_channel: 'online',
              merchant_name: 'Restaurant Chain',
            },
          ],
          modified: [],
          removed: [],
          has_more: false,
          next_cursor: 'cursor-456',
        },
      });
      
      // Mock account balance update
      (plaidClient.accountsGet as jest.Mock).mockResolvedValue({
        data: {
          accounts: [
            {
              account_id: 'account-sandbox-12345',
              balances: {
                current: 950.51,
                available: 850.51,
                iso_currency_code: 'USD',
              },
            },
          ],
          item: {
            item_id: 'item-sandbox-12345',
          },
        },
      });
      
      // Make API request
      const response = await request(app)
        .post('/api/plaid/sync-transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify response
      expect(response.body).toHaveProperty('message', 'Transactions synced successfully');
      expect(response.body.accountsProcessed).toBe(1);
      expect(response.body.transactionsAdded).toBe(1);
      
      // Verify new transaction was added to database
      const newTransaction = await Transaction.findOne({
        where: { plaidTransactionId: 'tx-2' },
      });
      expect(newTransaction).not.toBeNull();
      expect(newTransaction?.name).toBe('RESTAURANT PAYMENT');
      expect(Number(newTransaction?.amount)).toBe(25.99);
      
      // Verify account balance was updated
      const account = await Account.findOne({
        where: { plaidAccountId: 'account-sandbox-12345' },
      });
      expect(Number(account?.currentBalance)).toBe(950.51);
      expect(Number(account?.availableBalance)).toBe(850.51);
    });
    
    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/api/plaid/sync-transactions')
        .expect(401);
    });
  });
});