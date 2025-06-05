import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { sequelize, testConnection } from './config/database';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import accountRoutes from './routes/account.routes';
import transactionRoutes from './routes/transaction.routes';
import categoryRoutes from './routes/category.routes';
import assetRoutes from './routes/asset.routes';
import budgetRoutes from './routes/budget.routes';
import plaidRoutes from './routes/plaid.routes';
import summaryRoutes from './routes/summary.routes';
import chatRoutes from './routes/chat.routes';

// Create Express server
const app = express();

// Set up middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

// Configure CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://yourdomain.com' 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/plaid', plaidRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 8000;
let server: any;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Database synchronized');
    
    // Start Express server
    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  logger.info('Received kill signal, shutting down gracefully');
  
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      
      // Close database connection
      sequelize.close().then(() => {
        logger.info('Database connection closed');
        process.exit(0);
      }).catch((err) => {
        logger.error('Error closing database connection:', err);
        process.exit(1);
      });
    });
    
    // Force close if graceful shutdown fails
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }
};

// Start the server
startServer();

export default app;