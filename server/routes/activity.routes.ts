import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { activityService } from '../services/activity.service';
import { parsePagination, createPaginationMeta } from '../lib/validation';

const router = Router();

// GET /api/activity - List activity logs
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(
      req.query.page as string,
      req.query.limit as string
    );

    const filters: {
      userId?: number;
      action?: string;
      entityType?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {};

    if (req.query.userId) {
      filters.userId = parseInt(req.query.userId as string);
    }
    if (req.query.action) {
      filters.action = req.query.action as string;
    }
    if (req.query.entityType) {
      filters.entityType = req.query.entityType as string;
    }
    if (req.query.dateFrom) {
      filters.dateFrom = new Date(req.query.dateFrom as string);
    }
    if (req.query.dateTo) {
      filters.dateTo = new Date(req.query.dateTo as string);
    }

    const result = await activityService.list(
      req.organisationId!,
      filters,
      page,
      limit
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as activityRoutes };
