import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { AppError } from '../shared/utils/errors.js';
import { sendResponse } from '../shared/utils/response.js';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  const correlationId = 'ERR-' + Math.random().toString(36).substring(2, 11).toUpperCase();

  // Log the full detailed error with the correlation ID to the server logs
  logger.error(`[${correlationId}] [${req.method}] ${req.url} - Error: ${err.message} \nStack: ${err.stack}`);

  if (err instanceof AppError) {
    return sendResponse(
      res,
      err.statusCode,
      false,
      err.message,
      null,
      err.errors
    );
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    return sendResponse(
      res,
      400,
      false,
      'Validation failed',
      null,
      formattedErrors
    );
  }

  // Fallback for general uncaught errors (such as database or runtime issues)
  const isProduction = process.env.NODE_ENV === 'production';
  const clientMessage = isProduction
    ? `An internal server error occurred. Please reference Correlation ID: ${correlationId}`
    : err.message;

  const errorData = isProduction
    ? { correlationId }
    : {
        correlationId,
        name: err.name,
        stack: err.stack,
      };

  return sendResponse(
    res,
    500,
    false,
    clientMessage,
    null,
    errorData
  );
};
