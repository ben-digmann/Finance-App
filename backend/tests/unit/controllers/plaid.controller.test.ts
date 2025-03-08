import request from 'supertest';
import app from '../../../src/server';
import { User, Account } from '../../../src/models';
import { sequelize } from '../../../src/config/database';
import { plaidClient } from '../../../src/config/plaid';
import jwt from 'jsonwebtoken';

// Mock Plaid API responses
jest.mock('../../../src/config/plaid', () => ({
  plaidClient: {
    linkTokenCreate: jest.fn(),
    itemPublicTokenExchange: jest.fn(),
    accountsGet: jest.fn(),
    transactionsSync: jest.fn(),
  },
}));

// Setup and teardown
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Plaid Controller', () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    // Create a test user
    const user = await User.create({
      email: 'plaidtest@example.com',
      password: 'Password123!',
      firstName: 'Plaid',
      lastName: 'Test',
    });
    
    userId = user.id;
    
    // Generate JWT for the user
    authToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev_jwt_secret_replace_in_production',
      { expiresIn: '24h' }
    );
  });

  describe('GET /api/plaid/create-link-token', () => {
    it('should create a link token', async () => {
      // Mock Plaid response
      const mockLinkToken = 'link-sandbox-12345';
      (plaidClient.linkTokenCreate as jest.Mock).mockResolvedValue({
        data: {
          link_token: mockLinkToken,
          expiration: new Date(Date.now() + 3600000).toISOString(),
        },
      });

      const response = await request(app)
        .get('/api/plaid/create-link-token')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check response
      expect(response.body).toHaveProperty('linkToken');
      expect(response.body.linkToken).toBe(mockLinkToken);
      expect(response.body).toHaveProperty('expiration');
      
      // Verify Plaid was called with correct params
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
  });

  describe('POST /api/plaid/exchange-public-token', () => {
    it('should exchange a public token and save account information', async () => {
      // Mock Plaid responses
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
          added: [],
          modified: [],
          removed: [],
          has_more: false,
          next_cursor: 'cursor-123',
        },
      });

      const response = await request(app)
        .post('/api/plaid/exchange-public-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          publicToken: 'public-sandbox-12345',
        })
        .expect(200);

      // Check response
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accountsAdded');
      expect(response.body.accountsAdded).toBe(1);
      
      // Verify account was saved to database
      const accounts = await Account.findAll({ where: { userId } });
      expect(accounts.length).toBe(1);
      expect(accounts[0].plaidItemId).toBe(mockItemId);
      expect(accounts[0].plaidAccountId).toBe('account-sandbox-12345');
      expect(accounts[0].name).toBe('Checking Account');
      expect(accounts[0].type).toBe('depository');
      expect(accounts[0].currentBalance).toBe('1000.00');
    });

    it('should handle Plaid errors gracefully', async () => {
      // Mock Plaid error
      (plaidClient.itemPublicTokenExchange as jest.Mock).mockRejectedValue({
        response: {
          data: {
            error_code: 'INVALID_PUBLIC_TOKEN',
            error_message: 'The public token is invalid',
          },
        },
      });

      const response = await request(app)
        .post('/api/plaid/exchange-public-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          publicToken: 'invalid-token',
        })
        .expect(400);

      // Check error response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('INVALID_PUBLIC_TOKEN');
    });
  });
});