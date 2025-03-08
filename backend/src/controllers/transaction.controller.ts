import { Request, Response, NextFunction } from 'express';
import { Op, Sequelize } from 'sequelize';
import { Transaction, Account } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Get transactions with optional filtering
 */
export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const {
      startDate,
      endDate,
      accountId,
      category,
      page = 1,
      limit = 20,
    } = req.query;

    // Build filter conditions
    const where: any = { userId };

    if (startDate) {
      where.date = {
        ...where.date,
        [Op.gte]: new Date(startDate as string),
      };
    }

    if (endDate) {
      where.date = {
        ...where.date,
        [Op.lte]: new Date(endDate as string),
      };
    }

    if (accountId) {
      where.accountId = accountId;
    }

    if (category) {
      where[Op.or] = [
        { category },
        { llmCategory: category },
        { userCategory: category },
      ];
    }

    // Calculate pagination
    const offset = (Number(page) - 1) * Number(limit);

    // Get transactions
    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where,
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['name', 'mask', 'type', 'subtype'],
        },
      ],
      order: [['date', 'DESC']],
      limit: Number(limit),
      offset,
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / Number(limit));

    res.status(200).json({
      transactions,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific transaction by ID
 */
export const getTransactionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const transactionId = req.params.id;

    const transaction = await Transaction.findOne({
      where: {
        id: transactionId,
        userId,
      },
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['name', 'mask', 'type', 'subtype'],
        },
      ],
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    res.status(200).json({ transaction });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a transaction's category
 */
export const updateTransactionCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const transactionId = req.params.id;
    const { category } = req.body;

    const transaction = await Transaction.findOne({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    // Update the user-defined category
    await transaction.update({
      userCategory: category,
    });

    res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get monthly transaction statistics
 */
export const getMonthlyStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { year, month } = req.query;

    // Build date filter
    let dateFilter;
    if (year && month) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      dateFilter = {
        [Op.between]: [startDate, endDate],
      };
    } else if (year) {
      const startDate = new Date(Number(year), 0, 1);
      const endDate = new Date(Number(year), 11, 31);
      dateFilter = {
        [Op.between]: [startDate, endDate],
      };
    } else {
      // Default to current month
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter = {
        [Op.between]: [startDate, endDate],
      };
    }

    // Get income (negative amounts)
    const income = await Transaction.sum('amount', {
      where: {
        userId,
        date: dateFilter,
        amount: { [Op.lt]: 0 },
      },
    });

    // Get expenses (positive amounts)
    const expenses = await Transaction.sum('amount', {
      where: {
        userId,
        date: dateFilter,
        amount: { [Op.gt]: 0 },
      },
    });

    // Get transaction count
    const transactionCount = await Transaction.count({
      where: {
        userId,
        date: dateFilter,
      },
    });

    // Get top categories by spending
    const topCategories = await Transaction.findAll({
      attributes: [
        [
          Sequelize.literal(`
            CASE
              WHEN "userCategory" IS NOT NULL THEN "userCategory"
              WHEN "llmCategory" IS NOT NULL THEN "llmCategory"
              ELSE "category"
            END
          `),
          'category',
        ],
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'total'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      ],
      where: {
        userId,
        date: dateFilter,
        amount: { [Op.gt]: 0 }, // Only include expenses
      },
      group: [
        Sequelize.literal(`
          CASE
            WHEN "userCategory" IS NOT NULL THEN "userCategory"
            WHEN "llmCategory" IS NOT NULL THEN "llmCategory"
            ELSE "category"
          END
        `),
      ],
      order: [[Sequelize.fn('SUM', Sequelize.col('amount')), 'DESC']],
      limit: 5,
    });

    // Get daily spending for the period
    const dailySpending = await Transaction.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('date')), 'date'],
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'total'],
      ],
      where: {
        userId,
        date: dateFilter,
        amount: { [Op.gt]: 0 }, // Only include expenses
      },
      group: [Sequelize.fn('DATE', Sequelize.col('date'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('date')), 'ASC']],
    });

    res.status(200).json({
      income: Math.abs(income || 0),
      expenses: expenses || 0,
      net: Math.abs(income || 0) - (expenses || 0),
      transactionCount,
      topCategories,
      dailySpending,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get spending by category
 */
export const getSpendingByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { startDate, endDate } = req.query;

    // Build date filter
    let dateFilter: any = {};
    if (startDate) {
      dateFilter[Op.gte] = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter[Op.lte] = new Date(endDate as string);
    }

    // If no dates provided, default to current month
    if (!startDate && !endDate) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter = {
        [Op.between]: [firstDay, lastDay],
      };
    }

    // Get spending by category
    const categorySpending = await Transaction.findAll({
      attributes: [
        [
          Sequelize.literal(`
            CASE
              WHEN "userCategory" IS NOT NULL THEN "userCategory"
              WHEN "llmCategory" IS NOT NULL THEN "llmCategory"
              ELSE "category"
            END
          `),
          'category',
        ],
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'total'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      ],
      where: {
        userId,
        date: dateFilter,
        amount: { [Op.gt]: 0 }, // Only include expenses
      },
      group: [
        Sequelize.literal(`
          CASE
            WHEN "userCategory" IS NOT NULL THEN "userCategory"
            WHEN "llmCategory" IS NOT NULL THEN "llmCategory"
            ELSE "category"
          END
        `),
      ],
      order: [[Sequelize.fn('SUM', Sequelize.col('amount')), 'DESC']],
    });

    // Calculate total spending
    const totalSpending = categorySpending.reduce(
      (sum, category) => sum + Number(category.getDataValue('total')),
      0
    );

    // Calculate percentages
    const categoriesWithPercentage = categorySpending.map(category => ({
      category: category.getDataValue('category'),
      total: Number(category.getDataValue('total')),
      count: Number(category.getDataValue('count')),
      percentage: totalSpending > 0
        ? (Number(category.getDataValue('total')) / totalSpending) * 100
        : 0,
    }));

    res.status(200).json({
      categories: categoriesWithPercentage,
      totalSpending,
    });
  } catch (error) {
    next(error);
  }
};