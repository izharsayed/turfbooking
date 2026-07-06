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
  logger.error(`[${req.method}] ${req.url} - Error: ${err.message} \nStack: ${err.stack}`);

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

  // Fallback for general uncaught errors
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  return sendResponse(
    res,
    500,
    false,
    message,
    null,
    err.name !== 'Error' ? { name: err.name } : null
  );
};
