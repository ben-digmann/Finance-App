import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom error class for operational errors
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handling middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default values
  let statusCode = 500;
  let message = 'Internal Server Error';
  
  // If it's an AppError, use its status code and message
  if ('statusCode' in err) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log the error
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, { 
    error: err.stack 
  });

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message: message,
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};