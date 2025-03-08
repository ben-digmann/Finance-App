import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

// Simple local transaction classifier (no external API needed)
export async function classifyTransaction(transaction: {
  name: string;
  amount: number;
  date: string;
  description?: string;
}): Promise<string> {
  try {
    logger.debug('Classifying transaction locally:', {
      name: transaction.name,
      amount: transaction.amount,
      date: transaction.date
    });

    // Convert to lowercase for matching
    const name = transaction.name.toLowerCase();
    const description = (transaction.description || '').toLowerCase();
    const textToMatch = name + ' ' + description;
    
    // Define category patterns for matching
    const categoryPatterns: Record<string, RegExp[]> = {
      'Housing': [
        /rent|mortgage|property|real estate|apartment|housing|landlord|lease|condo|hoa/
      ],
      'Transportation': [
        /uber|lyft|taxi|car|auto|gas|fuel|transit|train|bus|subway|metro|toll|parking/
      ],
      'Food': [
        /grocery|restaurant|coffee|food|dining|doordash|grubhub|ubereats|meal|cafe|diner|pizza|burger|bakery/
      ],
      'Utilities': [
        /electricity|water|gas|power|utility|internet|cable|phone|cell|mobile|telecom|broadband/
      ],
      'Insurance': [
        /insurance|policy|premium|coverage|protect/
      ],
      'Healthcare': [
        /doctor|medical|health|hospital|clinic|pharmacy|prescription|dental|optical|therapy|healthcare/
      ],
      'Debt Payments': [
        /payment|loan|credit card|debt|interest|student loan|finance charge/
      ],
      'Entertainment': [
        /movie|entertainment|game|music|concert|theater|netflix|spotify|hulu|disney|streaming|subscription/
      ],
      'Shopping': [
        /amazon|walmart|target|store|mall|shop|retail|clothing|apparel|merchandise|purchase|online/
      ],
      'Personal Care': [
        /salon|spa|haircut|beauty|gym|fitness|personal care|cosmetic|makeup/
      ],
      'Education': [
        /tuition|school|college|university|class|course|education|book|student|learning/
      ],
      'Travel': [
        /travel|flight|airline|hotel|vacation|airbnb|booking|trip|lodging/
      ],
      'Gifts & Donations': [
        /gift|charity|donation|present|donate/
      ],
      'Income': [
        /payroll|salary|deposit|income|wage|earning|revenue|transfer/
      ]
    };

    // Check for matches in each category
    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(textToMatch)) {
          logger.debug(`Transaction classified as ${category}`);
          return category;
        }
      }
    }

    // Use amount to help with classification
    if (transaction.amount < 0 || 
        textToMatch.includes('deposit') || 
        textToMatch.includes('payment received')) {
      return 'Income';
    }

    // Default category if no patterns match
    logger.debug('No category match found, returning "Other"');
    return 'Other';
  } catch (error) {
    logger.error('Error classifying transaction:', error);
    return 'Other';
  }
}

// Mock OpenAI client to satisfy imports
const openai = {
  createCompletion: async () => ({ 
    data: { 
      choices: [{ text: 'Other' }] 
    } 
  })
};

export { openai };