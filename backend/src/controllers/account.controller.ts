import { Request, Response, NextFunction } from 'express';
import { Account } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Get all accounts for the authenticated user
 */
export const getAccounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const accounts = await Account.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    // Calculate total balances
    let totalBalance = 0;
    let totalAvailableBalance = 0;

    accounts.forEach(account => {
      if (account.currentBalance) {
        // Add to total balance if it's an asset (positive) or subtract if it's a liability (negative)
        if (account.type === 'credit' || account.type === 'loan') {
          totalBalance -= Number(account.currentBalance);
        } else {
          totalBalance += Number(account.currentBalance);
        }
      }

      if (account.availableBalance) {
        // Only add available balance for deposit accounts
        if (account.type !== 'credit' && account.type !== 'loan') {
          totalAvailableBalance += Number(account.availableBalance);
        }
      }
    });

    res.status(200).json({
      accounts,
      totalBalance,
      totalAvailableBalance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific account by ID
 */
export const getAccountById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const accountId = req.params.id;

    const account = await Account.findOne({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    res.status(200).json({ account });
  } catch (error) {
    next(error);
  }
};