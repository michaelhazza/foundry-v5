// Error codes registry from API Contract
export const ERROR_CODES = {
  // General errors
  BAD_REQUEST: 'BAD_REQUEST',
  INVALID_ID: 'INVALID_ID',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',

  // User management
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_INACTIVE: 'USER_INACTIVE',
  INVITATION_EXPIRED: 'INVITATION_EXPIRED',
  INVITATION_USED: 'INVITATION_USED',
  LAST_ADMIN: 'LAST_ADMIN',

  // Processing errors
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  PROCESSING_IN_PROGRESS: 'PROCESSING_IN_PROGRESS',
  NO_SOURCES: 'NO_SOURCES',
  NO_MAPPINGS: 'NO_MAPPINGS',

  // File errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_PARSE_ERROR: 'FILE_PARSE_ERROR',

  // API connection errors
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  INVALID_CREDENTIALS_API: 'INVALID_CREDENTIALS_API',

  // Operation errors
  INVALID_OPERATION: 'INVALID_OPERATION',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Base error class
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

// Specific error classes
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: Record<string, unknown>) {
    super(ERROR_CODES.BAD_REQUEST, message, 400, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: Record<string, unknown>) {
    super(ERROR_CODES.VALIDATION_ERROR, message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: ErrorCode = ERROR_CODES.UNAUTHORIZED) {
    super(code, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(ERROR_CODES.FORBIDDEN, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: number | string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(ERROR_CODES.NOT_FOUND, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: Record<string, unknown>) {
    super(ERROR_CODES.RESOURCE_CONFLICT, message, 409, details);
  }
}

export class UnprocessableError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODES.VALIDATION_ERROR, details?: Record<string, unknown>) {
    super(code, message, 422, details);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super(ERROR_CODES.RATE_LIMITED, `Too many requests. Please try again in ${retryAfter} seconds.`, 429, {
      retryAfter,
    });
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(ERROR_CODES.INTERNAL_ERROR, message, 500);
  }
}
