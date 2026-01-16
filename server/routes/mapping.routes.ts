import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { mappingService } from '../services/mapping.service';
import { parseIntParam } from '../lib/validation';
import { updateMappingSchema } from '@shared/validators';

const router = Router();

// GET /api/projects/:projectId/mapping - Get field mappings
router.get('/projects/:projectId/mapping', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const mappings = await mappingService.getProjectMappings(
      req.organisationId!,
      projectId
    );
    res.json({ data: mappings });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:projectId/mapping - Update field mappings
router.put('/projects/:projectId/mapping', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const { mappings } = updateMappingSchema.parse(req.body);

    const updated = await mappingService.updateProjectMappings(
      req.organisationId!,
      projectId,
      mappings
    );
    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/mapping/suggestions - Get auto-detected mappings
router.get('/projects/:projectId/mapping/suggestions', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const suggestions = await mappingService.getAutoDetectedMappings(
      req.organisationId!,
      projectId
    );
    res.json({ data: suggestions });
  } catch (error) {
    next(error);
  }
});

export { router as mappingRoutes };
