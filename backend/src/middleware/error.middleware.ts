import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors';
import { ApiResponse } from '../common/types';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const timestamp = new Date().toISOString();

  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: { timestamp },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Zod Schema Validation Errors
  if (err && (err.name === 'ZodError' || 'issues' in err)) {
    const zodErr = err as any;
    const firstIssue = zodErr.issues?.[0];
    const message = firstIssue?.message || 'Validation failed';
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message,
        details: zodErr.issues,
      },
      meta: { timestamp },
    };
    res.status(400).json(response);
    return;
  }

  console.error('Unhandled Server Error:', err);
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred',
    },
    meta: { timestamp },
  };
  res.status(500).json(response);
};
