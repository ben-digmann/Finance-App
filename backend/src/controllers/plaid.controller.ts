import { Request, Response, NextFunction } from 'express';
import { plaidClient } from '../config/plaid';
import { classifyTransaction } from '../config/openai';
import { User, Account, Transaction } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { CountryCode, Products, WebhookType } from 'plaid';

/**
 * Create a link token for Plaid Link initialization
 */
export const createLinkToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:8000';
    
    logger.debug('Creating link token for user:', userId);
    logger.debug('Plaid credentials:', {
      clientId: process.env.PLAID_CLIENT_ID ? '✓ Set' : '✗ Not set',
      secret: process.env.PLAID_SECRET ? '✓ Set' : '✗ Not set',
      env: process.env.PLAID_ENV || 'sandbox'
    });

    // Get webhook URL based on environment
    const webhookUrl = process.env.NODE_ENV === 'production'
      ? `${baseUrl}/api/plaid/webhook`  // Production webhook URL
      : 'https://webhook.site/your-test-id'; // For testing in development, replace with your webhook.site URL or ngrok URL

    // Create a link token with the user's ID as client_user_id
    logger.debug('Calling Plaid linkTokenCreate with params:', {
      user_id: userId.toString(),
      client_name: 'Finance App',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
      webhook: webhookUrl
    });

    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId.toString(),
      },
      client_name: 'Finance App',
      products: ['transactions'] as Products[],
      country_codes: ['US'] as CountryCode[],
      language: 'en',
      webhook: webhookUrl, // Add webhook for real-time updates
      access_token: req.query.accessToken as string || undefined, // For update mode, if provided
    });

    const linkToken = response.data.link_token;
    const expiration = response.data.expiration;

    logger.info(`Link token created for user ${userId}:`, { 
      linkToken: linkToken.substring(0, 10) + '...',
      expiration
    });
    
    res.status(200).json({
      linkToken,
      expiration,
    });
  } catch (error: any) {
    logger.error('Error creating link token:', error);
    if (error.response?.data) {
      logger.error('Plaid API error details:', error.response.data);
      return next(new AppError(`Plaid error: ${error.response.data.error_code} - ${error.response.data.error_message}`, 400));
    }
    next(error);
  }
};

/**
 * Exchange a public token for an access token and item ID
 */
export const exchangePublicToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { publicToken } = req.body;

    if (!publicToken) {
      throw new AppError('Public token is required', 400);
    }

    // Exchange the public token for an access token
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;

    // Get account details
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Save accounts to database
    let accountsAdded = 0;
    for (const account of accountsResponse.data.accounts) {
      await Account.create({
        userId,
        plaidAccountId: account.account_id,
        plaidItemId: itemId,
        accessToken,
        name: account.name,
        officialName: account.official_name || null,
        type: account.type,
        subtype: account.subtype || null,
        mask: account.mask || null,
        currentBalance: account.balances.current || 0,
        availableBalance: account.balances.available || null,
        isoCurrencyCode: account.balances.iso_currency_code || 'USD',
        lastUpdated: new Date(),
      });
      accountsAdded++;
    }

    // Initial transaction sync
    await syncTransactions(userId, accessToken);

    res.status(200).json({
      success: true,
      accountsAdded,
    });
  } catch (error: any) {
    logger.error('Error exchanging public token:', error);
    if (error.response?.data) {
      return next(new AppError(`Plaid error: ${error.response.data.error_code} - ${error.response.data.error_message}`, 400));
    }
    next(error);
  }
};

/**
 * Helper function to sync transactions for a given access token
 */
export const syncTransactions = async (userId: number, accessToken: string) => {
  try {
    let hasMore = true;
    let cursor = null;
    let addedCount = 0;
    let modifiedCount = 0;
    let removedCount = 0;

    // Find all accounts for this access token to map transactions
    const accounts = await Account.findAll({
      where: {
        accessToken,
        userId,
      },
    });

    const accountMap = new Map();
    for (const account of accounts) {
      accountMap.set(account.plaidAccountId, account.id);
    }

    // Loop until all transactions are synced
    while (hasMore) {
      const request: any = {
        access_token: accessToken,
      };

      if (cursor) {
        request.cursor = cursor;
      }

      const response = await plaidClient.transactionsSync(request);
      const data = response.data;

      // Process added transactions
      for (const transaction of data.added) {
        const accountId = accountMap.get(transaction.account_id);
        
        if (accountId) {
          // Use LLM to classify the transaction
          const llmCategory = await classifyTransaction({
            name: transaction.name,
            amount: transaction.amount,
            date: transaction.date,
            description: transaction.original_description || undefined,
          });

          await Transaction.create({
            userId,
            accountId,
            plaidTransactionId: transaction.transaction_id,
            category: transaction.category?.[0] || null,
            subcategory: transaction.category?.[1] || null,
            llmCategory,
            name: transaction.name,
            merchantName: transaction.merchant_name || null,
            amount: transaction.amount,
            date: new Date(transaction.date),
            pending: transaction.pending,
            paymentChannel: transaction.payment_channel,
            address: transaction.location?.address || null,
            city: transaction.location?.city || null,
            country: transaction.location?.country || null,
            postalCode: transaction.location?.postal_code || null,
            region: transaction.location?.region || null,
            isoCurrencyCode: transaction.iso_currency_code || 'USD',
          });
          
          addedCount++;
        }
      }

      // Process modified transactions
      for (const transaction of data.modified) {
        const accountId = accountMap.get(transaction.account_id);
        
        if (accountId) {
          const existing = await Transaction.findOne({
            where: {
              plaidTransactionId: transaction.transaction_id,
            },
          });

          if (existing) {
            const llmCategory = await classifyTransaction({
              name: transaction.name,
              amount: transaction.amount,
              date: transaction.date,
              description: transaction.original_description || undefined,
            });

            await existing.update({
              category: transaction.category?.[0] || null,
              subcategory: transaction.category?.[1] || null,
              llmCategory,
              name: transaction.name,
              merchantName: transaction.merchant_name || null,
              amount: transaction.amount,
              date: new Date(transaction.date),
              pending: transaction.pending,
              paymentChannel: transaction.payment_channel,
              address: transaction.location?.address || null,
              city: transaction.location?.city || null,
              country: transaction.location?.country || null,
              postalCode: transaction.location?.postal_code || null,
              region: transaction.location?.region || null,
              isoCurrencyCode: transaction.iso_currency_code || 'USD',
            });
            
            modifiedCount++;
          }
        }
      }

      // Process removed transactions
      for (const transaction of data.removed) {
        await Transaction.destroy({
          where: {
            plaidTransactionId: transaction.transaction_id,
          },
        });
        
        removedCount++;
      }

      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    logger.info(`Synced transactions: ${addedCount} added, ${modifiedCount} modified, ${removedCount} removed`);
    return { addedCount, modifiedCount, removedCount };
  } catch (error) {
    logger.error('Error syncing transactions:', error);
    throw error;
  }
};

/**
 * Manually sync transactions for a user's accounts
 */
export const manualTransactionSync = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    
    // Get all user's accounts
    const accounts = await Account.findAll({
      where: { userId },
    });

    if (accounts.length === 0) {
      return res.status(200).json({
        message: 'No accounts to sync',
        accountsProcessed: 0,
      });
    }

    // Process each unique access token
    const processedTokens = new Set();
    let totalAdded = 0;
    let totalModified = 0;
    let totalRemoved = 0;
    
    for (const account of accounts) {
      if (!processedTokens.has(account.accessToken)) {
        processedTokens.add(account.accessToken);
        
        const { addedCount, modifiedCount, removedCount } = await syncTransactions(
          userId,
          account.accessToken
        );
        
        totalAdded += addedCount;
        totalModified += modifiedCount;
        totalRemoved += removedCount;
      }
    }

    // Update account balances
    for (const account of accounts) {
      const accountResponse = await plaidClient.accountsGet({
        access_token: account.accessToken,
      });
      
      const plaidAccount = accountResponse.data.accounts.find(
        (a) => a.account_id === account.plaidAccountId
      );
      
      if (plaidAccount) {
        await account.update({
          currentBalance: plaidAccount.balances.current || 0,
          availableBalance: plaidAccount.balances.available || null,
          lastUpdated: new Date(),
        });
      }
    }

    res.status(200).json({
      message: 'Transactions synced successfully',
      accountsProcessed: processedTokens.size,
      transactionsAdded: totalAdded,
      transactionsModified: totalModified,
      transactionsRemoved: totalRemoved,
    });
  } catch (error: any) {
    logger.error('Error in manual transaction sync:', error);
    if (error.response?.data) {
      return next(new AppError(`Plaid error: ${error.response.data.error_code} - ${error.response.data.error_message}`, 400));
    }
    next(error);
  }
};

/**
 * Handle Plaid webhooks for real-time updates
 */
export const handlePlaidWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify the webhook signature if in production
    if (process.env.NODE_ENV === 'production' && process.env.PLAID_WEBHOOK_SECRET) {
      // Implement signature verification with Plaid's API
      // This should be implemented in production deployments
    }

    const { webhook_type, webhook_code, item_id } = req.body;
    
    logger.info(`Received Plaid webhook: ${webhook_type} - ${webhook_code} for item ${item_id}`);

    // Find all accounts associated with this item_id
    const accounts = await Account.findAll({
      where: { plaidItemId: item_id },
    });

    if (accounts.length === 0) {
      logger.warn(`No accounts found for item_id: ${item_id}`);
      return res.status(200).send('Webhook received');
    }

    // Get the first account to get userId and accessToken
    const account = accounts[0];
    const { userId, accessToken } = account;

    // Handle webhook by type
    switch (webhook_type) {
      case WebhookType.Transactions:
        // Transaction webhooks
        switch (webhook_code) {
          case 'SYNC_UPDATES_AVAILABLE':
            // New transactions are available to sync
            await syncTransactions(userId, accessToken);
            break;
          
          case 'DEFAULT_UPDATE':
          case 'HISTORICAL_UPDATE':
            // Initial or historical transactions update
            await syncTransactions(userId, accessToken);
            break;
        }
        break;
      
      case WebhookType.Item:
        // Item webhooks
        switch (webhook_code) {
          case 'ERROR':
            // Item error occurred
            logger.error(`Plaid item error for user ${userId}: ${JSON.stringify(req.body.error)}`);
            // Update item status in database
            await Promise.all(accounts.map(account => 
              account.update({ 
                status: 'ERROR',
                errorCode: req.body.error?.error_code || 'UNKNOWN',
                lastUpdated: new Date()
              })
            ));
            break;
          
          case 'PENDING_EXPIRATION':
            // Item access is about to expire
            logger.warn(`Plaid item pending expiration for user ${userId}`);
            // Notify user to update credentials
            // This would require a notification system
            break;
        }
        break;
    }

    // Always return 200 to acknowledge receipt of the webhook
    return res.status(200).send('Webhook processed');
  } catch (error: any) {
    logger.error('Error processing Plaid webhook:', error);
    // Still return 200 to acknowledge the webhook
    return res.status(200).send('Webhook received with errors');
  }
};