import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment before using variables
dotenv.config();

// Custom LLM configuration
const LLM_API_URL =
  process.env.LLM_API_URL ||
  'https://s5rs0cklk8.execute-api.us-east-1.amazonaws.com/Prod/v1/chat/completions';
const LLM_API_TOKEN = process.env.LLM_API_TOKEN;


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

export async function askQuestion(prompt: string): Promise<string> {
  try {
    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(LLM_API_TOKEN ? { Authorization: `Bearer ${LLM_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || '';
    return answer;
  } catch (error) {
    logger.error('Error calling LLM:', error);
    return 'Unable to generate response';
  }
}
