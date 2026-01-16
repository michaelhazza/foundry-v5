import { BadRequestError, ERROR_CODES } from '../errors';

/**
 * Parse and validate an integer parameter from URL params
 * @param value - The string value to parse (or string array, takes first element)
 * @param paramName - The parameter name for error messages
 * @returns The parsed integer
 * @throws BadRequestError if the value is not a valid positive integer
 */
export function parseIntParam(value: string | string[], paramName: string): number {
  const strValue = Array.isArray(value) ? value[0] : value;
  const parsed = parseInt(strValue, 10);

  if (isNaN(parsed) || parsed < 1 || !Number.isInteger(parsed)) {
    throw new BadRequestError(`Invalid ${paramName}: must be a positive integer`, {
      code: ERROR_CODES.INVALID_ID,
      param: paramName,
      value: strValue,
    });
  }

  return parsed;
}

/**
 * Parse optional pagination parameters
 * @param page - Page number string
 * @param limit - Limit per page string
 * @returns Object with page and limit numbers
 */
export function parsePagination(
  page?: string,
  limit?: string
): { page: number; limit: number; offset: number } {
  const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1;
  const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit, 10) || 20)) : 20;
  const offset = (pageNum - 1) * limitNum;

  return { page: pageNum, limit: limitNum, offset };
}

/**
 * Create pagination metadata for response
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
): { total: number; page: number; limit: number; totalPages: number } {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
