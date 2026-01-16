import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { users, invitations, organisations } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { authService } from '../services/auth.service';
import { requireAuth, requireAdmin } from '../middleware/auth';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ERROR_CODES,
} from '../errors';
import { parseIntParam } from '../lib/validation';
import { inviteUserSchema, updateUserRoleSchema } from '@shared/validators';
import logger from '../lib/logger';

const router = Router();

// GET /api/users - List organisation users (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const orgUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.organisationId, req.organisationId!));

    res.json({ data: orgUsers });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/invite - Send invitation (admin only)
router.post('/invite', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { email, role } = inviteUserSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.organisationId, req.organisationId!),
          eq(users.email, normalizedEmail)
        )
      )
      .limit(1);

    if (existingUser) {
      throw new ConflictError('User already exists with this email');
    }

    // Check for pending invitation
    const [pendingInvite] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.organisationId, req.organisationId!),
          eq(invitations.email, normalizedEmail),
          isNull(invitations.acceptedAt)
        )
      )
      .limit(1);

    if (pendingInvite && new Date() < pendingInvite.expiresAt) {
      throw new ConflictError('A pending invitation already exists for this email');
    }

    // Create invitation
    const token = authService.generateSecureToken();
    const expiresAt = authService.getInvitationExpiry();

    const [invitation] = await db
      .insert(invitations)
      .values({
        organisationId: req.organisationId!,
        email: normalizedEmail,
        role,
        token,
        invitedById: req.userId!,
        expiresAt,
      })
      .returning();

    // TODO: Send invitation email
    logger.info(`Invitation token for ${email}: ${token}`);

    res.status(201).json({
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - Deactivate user (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const userId = parseIntParam(req.params.id, 'id');

    // Can't delete yourself
    if (userId === req.userId) {
      throw new ForbiddenError('Cannot deactivate your own account');
    }

    // Check user exists and belongs to org
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.organisationId, req.organisationId!)
        )
      )
      .limit(1);

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Check if this is the last admin
    if (user.role === 'admin') {
      const adminCount = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.organisationId, req.organisationId!),
            eq(users.role, 'admin'),
            eq(users.isActive, true)
          )
        );

      if (adminCount.length <= 1) {
        throw new ForbiddenError('Cannot remove the last admin');
      }
    }

    // Soft delete (deactivate)
    await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, userId));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/role - Change user role (admin only)
router.patch('/:id/role', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const userId = parseIntParam(req.params.id, 'id');
    const { role } = updateUserRoleSchema.parse(req.body);

    // Can't change own role
    if (userId === req.userId) {
      throw new ForbiddenError('Cannot change your own role');
    }

    // Check user exists
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.organisationId, req.organisationId!)
        )
      )
      .limit(1);

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // If demoting from admin, check not last admin
    if (user.role === 'admin' && role === 'member') {
      const adminCount = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.organisationId, req.organisationId!),
            eq(users.role, 'admin'),
            eq(users.isActive, true)
          )
        );

      if (adminCount.length <= 1) {
        throw new ForbiddenError('Cannot demote the last admin');
      }
    }

    // Update role
    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };
