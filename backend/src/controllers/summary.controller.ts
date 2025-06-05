import { Request, Response, NextFunction } from 'express';
import { Account, Asset, Budget, Transaction } from '../models';

export const getFinancialSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const [accounts, assets, budgets, transactions] = await Promise.all([
      Account.findAll({ where: { userId } }),
      Asset.findAll({ where: { userId } }),
      Budget.findAll({ where: { userId, isActive: true } }),
      Transaction.findAll({ where: { userId } })
    ]);

    // Net worth calculations
    const accountBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
    const assetValue = assets.reduce((sum, a) => sum + Number(a.value || 0), 0);
    const netWorth = accountBalance + assetValue;

    // Spending by category
    const spendingByCategory: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.amount > 0) {
        const cat = t.getEffectiveCategory();
        spendingByCategory[cat] = (spendingByCategory[cat] || 0) + Number(t.amount);
      }
    });

    res.status(200).json({
      accounts: accountBalance,
      assets: assetValue,
      netWorth,
      budgets,
      spendingByCategory
    });
  } catch (error) {
    next(error);
  }
};
