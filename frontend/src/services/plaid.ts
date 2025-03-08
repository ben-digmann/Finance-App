import api from './api';

export interface PlaidLinkToken {
  linkToken: string;
  expiration: string;
}

export interface PlaidExchangeResponse {
  success: boolean;
  accountsAdded: number;
}

/**
 * Get a link token for Plaid Link initialization
 */
export const createLinkToken = async (): Promise<PlaidLinkToken> => {
  const response = await api.get('/plaid/create-link-token');
  return response.data;
};

/**
 * Exchange a public token for access token and account information
 */
export const exchangePublicToken = async (publicToken: string): Promise<PlaidExchangeResponse> => {
  const response = await api.post('/plaid/exchange-public-token', { publicToken });
  return response.data;
};

/**
 * Manually sync transactions for connected accounts
 */
export const syncTransactions = async (): Promise<{
  message: string;
  accountsProcessed: number;
  transactionsAdded: number;
  transactionsModified: number;
  transactionsRemoved: number;
}> => {
  const response = await api.post('/plaid/sync-transactions');
  return response.data;
};