import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { users, organisations, invitations, passwordResetTokens } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rate-limit';
import {
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  UnprocessableError,
  ERROR_CODES,
} from '../errors';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@shared/validators';
import logger from '../lib/logger';

const router = Router();

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email (case-insensitive)
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        passwordHash: users.passwordHash,
        organisationId: users.organisationId,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password', ERROR_CODES.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive', ERROR_CODES.USER_INACTIVE);
    }

    const isValid = await authService.verifyPassword(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password', ERROR_CODES.INVALID_CREDENTIALS);
    }

    // Get organisation
    const [org] = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, user.organisationId))
      .limit(1);

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Generate token
    const token = authService.generateToken({
      userId: user.id,
      organisationId: user.organisationId,
      role: user.role,
    });

    res.json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organisationId: user.organisationId,
          organisation: {
            id: org.id,
            name: org.name,
            slug: org.slug,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/register (invitation acceptance)
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { token, name, password } = registerSchema.parse(req.body);

    // Find invitation
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);

    if (!invitation) {
      throw new NotFoundError('Invitation');
    }

    if (invitation.acceptedAt) {
      throw new ConflictError('Invitation has already been used');
    }

    if (new Date() > invitation.expiresAt) {
      throw new UnprocessableError('Invitation has expired', ERROR_CODES.INVITATION_EXPIRED);
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.organisationId, invitation.organisationId),
          eq(users.email, invitation.email.toLowerCase())
        )
      )
      .limit(1);

    if (existingUser) {
      throw new ConflictError('User already exists with this email');
    }

    // Create user
    const passwordHash = await authService.hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({
        organisationId: invitation.organisationId,
        email: invitation.email.toLowerCase(),
        passwordHash,
        name,
        role: invitation.role,
      })
      .returning();

    // Mark invitation as accepted
    await db
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invitation.id));

    // Get organisation
    const [org] = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, user.organisationId))
      .limit(1);

    // Generate token
    const authToken = authService.generateToken({
      userId: user.id,
      organisationId: user.organisationId,
      role: user.role,
    });

    res.status(201).json({
      data: {
        token: authToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organisationId: user.organisationId,
          organisation: {
            id: org.id,
            name: org.name,
            slug: org.slug,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (_req, res) => {
  // Client-side token deletion; this endpoint exists for consistency
  res.json({ data: { message: 'Logged out successfully' } });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        organisationId: users.organisationId,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);

    const [org] = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, user.organisationId))
      .limit(1);

    res.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organisationId: user.organisationId,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        organisation: {
          id: org.id,
          name: org.name,
          slug: org.slug,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    // Always return success for security (don't reveal if email exists)
    const response = { data: { message: 'If an account exists, a reset email has been sent' } };

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return res.json(response);
    }

    // Generate reset token
    const token = authService.generateSecureToken();
    const expiresAt = authService.getPasswordResetExpiry();

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // TODO: Send email with reset link
    // For now, log the token in development
    logger.info(`Password reset token for ${email}: ${token}`);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    // Find token
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (!resetToken) {
      throw new NotFoundError('Reset token');
    }

    if (resetToken.usedAt) {
      throw new ConflictError('Reset token has already been used');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new UnprocessableError('Reset token has expired', ERROR_CODES.TOKEN_EXPIRED);
    }

    // Update password
    const passwordHash = await authService.hashPassword(password);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetToken.userId));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));

    res.json({ data: { message: 'Password reset successfully' } });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };
