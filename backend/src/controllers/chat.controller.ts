import { Request, Response, NextFunction } from 'express';
import { askQuestion } from '../config/openai';
import { Account, Asset, Transaction } from '../models';
import { logger } from '../utils/logger';

export const askFinanceQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const accounts = await Account.findAll({ where: { userId } });
    const assets = await Asset.findAll({ where: { userId } });
    const transactions = await Transaction.findAll({
      where: { userId },
      order: [['date', 'DESC']],
      limit: 100,
    });

    const summary = {
      accounts: accounts.map(a => ({ name: a.name, balance: a.currentBalance })),
      assets: assets.map(a => ({ name: a.name, value: a.value })),
      transactions: transactions.map(t => ({
        date: t.date,
        name: t.name,
        amount: t.amount,
        category: t.getEffectiveCategory(),
      })),
    };

    const prompt = `You are a helpful personal finance assistant. Answer the user's question based on their data.\nUser question: ${question}\nUser data: ${JSON.stringify(summary)}`;

    logger.debug('Sending prompt to OpenAI', { prompt });
    const answer = await askQuestion(prompt);

    res.status(200).json({ answer });
  } catch (error) {
    next(error);
  }
};
