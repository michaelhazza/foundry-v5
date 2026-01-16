import { Router } from 'express';
import { db } from '../db';
import { projects, sources } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { NotFoundError } from '../errors';
import { parseIntParam, parsePagination, createPaginationMeta } from '../lib/validation';
import { createProjectSchema, updateProjectSchema } from '@shared/validators';

const router = Router();

// GET /api/projects - List projects
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string,
      req.query.limit as string
    );

    // Get projects with source count
    const projectList = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        createdById: projects.createdById,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(eq(projects.organisationId, req.organisationId!))
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);

    // Get source counts
    const projectsWithCounts = await Promise.all(
      projectList.map(async (project) => {
        const [sourceCountResult] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(sources)
          .where(eq(sources.projectId, project.id));

        return {
          ...project,
          sourceCount: sourceCountResult?.count || 0,
        };
      })
    );

    // Get total count
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.organisationId, req.organisationId!));

    res.json({
      data: projectsWithCounts,
      meta: createPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - Create project
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = createProjectSchema.parse(req.body);

    const [project] = await db
      .insert(projects)
      .values({
        organisationId: req.organisationId!,
        name: data.name,
        description: data.description,
        createdById: req.userId!,
      })
      .returning();

    res.status(201).json({ data: { ...project, sourceCount: 0 } });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Get project details
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.id, 'id');

    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.organisationId, req.organisationId!)
        )
      )
      .limit(1);

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    // Get source count
    const [sourceCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sources)
      .where(eq(sources.projectId, projectId));

    res.json({
      data: {
        ...project,
        sourceCount: sourceCountResult?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:id - Update project
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.id, 'id');
    const data = updateProjectSchema.parse(req.body);

    // Check project exists
    const [existing] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.organisationId, req.organisationId!)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Project', projectId);
    }

    const [updated] = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - Delete project (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.id, 'id');

    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.organisationId, req.organisationId!)
        )
      )
      .limit(1);

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    await db.delete(projects).where(eq(projects.id, projectId));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as projectRoutes };
