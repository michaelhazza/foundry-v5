import { Router } from 'express';
import { db } from '../db';
import { invitations, users, organisations } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { NotFoundError, UnprocessableError, ERROR_CODES } from '../errors';
import { parseIntParam } from '../lib/validation';

const router = Router();

// GET /api/invitations - List pending invitations (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const pendingInvitations = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        expiresAt: invitations.expiresAt,
        createdAt: invitations.createdAt,
        invitedById: invitations.invitedById,
      })
      .from(invitations)
      .where(
        and(
          eq(invitations.organisationId, req.organisationId!),
          isNull(invitations.acceptedAt)
        )
      );

    // Get inviter names
    const result = await Promise.all(
      pendingInvitations.map(async (inv) => {
        const [inviter] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, inv.invitedById))
          .limit(1);

        return {
          id: inv.id,
          email: inv.email,
          role: inv.role,
          expiresAt: inv.expiresAt,
          createdAt: inv.createdAt,
          invitedBy: { id: inv.invitedById, name: inviter?.name || 'Unknown' },
        };
      })
    );

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/invitations/:id - Cancel invitation (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const invitationId = parseIntParam(req.params.id, 'id');

    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, invitationId),
          eq(invitations.organisationId, req.organisationId!)
        )
      )
      .limit(1);

    if (!invitation) {
      throw new NotFoundError('Invitation', invitationId);
    }

    await db.delete(invitations).where(eq(invitations.id, invitationId));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /api/invitations/:token/validate - Validate invitation token (public)
router.get('/:token/validate', async (req, res, next) => {
  try {
    const { token } = req.params;

    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);

    if (!invitation) {
      throw new NotFoundError('Invitation');
    }

    if (invitation.acceptedAt) {
      throw new UnprocessableError('Invitation has already been accepted', ERROR_CODES.INVITATION_USED);
    }

    if (new Date() > invitation.expiresAt) {
      throw new UnprocessableError('Invitation has expired', ERROR_CODES.INVITATION_EXPIRED);
    }

    // Get organisation and inviter info
    const [org] = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, invitation.organisationId))
      .limit(1);

    const [inviter] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, invitation.invitedById))
      .limit(1);

    res.json({
      data: {
        email: invitation.email,
        role: invitation.role,
        organisation: {
          id: org.id,
          name: org.name,
        },
        invitedBy: {
          id: inviter.id,
          name: inviter.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as invitationRoutes };
