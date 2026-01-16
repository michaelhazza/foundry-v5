import { Router } from 'express';
import { db } from '../db';
import { organisations } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { NotFoundError, ForbiddenError } from '../errors';
import { parseIntParam } from '../lib/validation';

const router = Router();

// GET /api/organisations/:id - Get organisation details
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const orgId = parseIntParam(req.params.id, 'id');

    // Users can only view their own organisation
    if (orgId !== req.organisationId) {
      throw new ForbiddenError('Cannot access other organisations');
    }

    const [org] = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, orgId))
      .limit(1);

    if (!org) {
      throw new NotFoundError('Organisation', orgId);
    }

    res.json({ data: org });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/organisations/:id - Update organisation
router.patch('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const orgId = parseIntParam(req.params.id, 'id');

    // Users can only update their own organisation
    if (orgId !== req.organisationId) {
      throw new ForbiddenError('Cannot update other organisations');
    }

    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    const [updated] = await db
      .update(organisations)
      .set({
        name: name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(organisations.id, orgId))
      .returning();

    if (!updated) {
      throw new NotFoundError('Organisation', orgId);
    }

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

export { router as organisationRoutes };
