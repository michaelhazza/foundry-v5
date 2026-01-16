import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ERROR_CODES, ValidationError, InternalError } from '../errors';
import logger from '../lib/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error({
    err,
    method: req.method,
    path: req.path,
    body: req.body,
  });

  // Handle known AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationError = new ValidationError('Validation failed', {
      issues: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    res.status(validationError.statusCode).json(validationError.toJSON());
    return;
  }

  // Handle unexpected errors
  const internalError = new InternalError(
    process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  );
  res.status(internalError.statusCode).json(internalError.toJSON());
}

// 404 handler for unknown routes
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
