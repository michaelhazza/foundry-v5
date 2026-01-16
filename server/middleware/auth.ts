import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { db } from '../db';
import { users, organisations } from '../db/schema';
import { eq } from 'drizzle-orm';
import { UnauthorizedError, ForbiddenError, ERROR_CODES } from '../errors';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      organisationId?: number;
      userRole?: 'admin' | 'member';
      user?: {
        id: number;
        email: string;
        name: string;
        role: 'admin' | 'member';
        organisationId: number;
      };
    }
  }
}

/**
 * Middleware to verify JWT token and attach user info to request
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided', ERROR_CODES.UNAUTHORIZED);
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedError('Invalid or expired token', ERROR_CODES.TOKEN_INVALID);
    }

    // Verify user still exists and is active
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        organisationId: users.organisationId,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive', ERROR_CODES.USER_INACTIVE);
    }

    // Attach user info to request
    req.userId = user.id;
    req.organisationId = user.organisationId;
    req.userRole = user.role;
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organisationId: user.organisationId,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.userRole !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }
  next();
}

/**
 * Optional auth - attaches user if token present but doesn't require it
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    if (!payload) {
      return next();
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        organisationId: users.organisationId,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (user && user.isActive) {
      req.userId = user.id;
      req.organisationId = user.organisationId;
      req.userRole = user.role;
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organisationId: user.organisationId,
      };
    }

    next();
  } catch {
    next();
  }
}
