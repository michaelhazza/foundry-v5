import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { filterService } from '../services/filter.service';
import { parseIntParam } from '../lib/validation';
import { createFilterSchema, updateFilterSchema } from '@shared/validators';

const router = Router();

// GET /api/projects/:projectId/filters - Get filters
router.get('/projects/:projectId/filters', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const filters = await filterService.getProjectFilters(
      req.organisationId!,
      projectId
    );
    res.json({ data: filters });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/filters - Create filter
router.post('/projects/:projectId/filters', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const data = createFilterSchema.parse(req.body);
    const filter = await filterService.createFilter(
      req.organisationId!,
      projectId,
      data
    );
    res.status(201).json({ data: filter });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/quality-filters/:id - Update filter
router.patch('/quality-filters/:id', requireAuth, async (req, res, next) => {
  try {
    const filterId = parseIntParam(req.params.id, 'id');
    const data = updateFilterSchema.parse(req.body);
    const filter = await filterService.updateFilter(
      req.organisationId!,
      filterId,
      data
    );
    res.json({ data: filter });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/quality-filters/:id - Delete filter
router.delete('/quality-filters/:id', requireAuth, async (req, res, next) => {
  try {
    const filterId = parseIntParam(req.params.id, 'id');
    await filterService.deleteFilter(req.organisationId!, filterId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as filterRoutes };
