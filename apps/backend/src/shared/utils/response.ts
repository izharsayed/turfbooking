import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  errors: any | null;
  meta?: any | null;
}

export function sendResponse<T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data: T | null = null,
  errors: any | null = null,
  meta: any | null = null
): Response {
  const responsePayload: ApiResponse<T> = {
    success,
    message,
    data,
    errors,
    meta,
  };
  return res.status(statusCode).json(responsePayload);
}
