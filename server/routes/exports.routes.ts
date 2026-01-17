import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { exportService } from '../services/export.service';
import { parseIntParam } from '../lib/validation';

const router = Router();

// GET /api/exports/:id - Get export details
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const exportId = parseIntParam(req.params.id, 'id');
    const exportData = await exportService.getExport(req.organisationId!, exportId);
    res.json({ data: exportData });
  } catch (error) {
    next(error);
  }
});

// GET /api/exports/:id/download - Download export
router.get('/:id/download', requireAuth, async (req, res, next) => {
  try {
    const exportId = parseIntParam(req.params.id, 'id');
    const { content, filename, mimeType } = await exportService.downloadExport(
      req.organisationId!,
      exportId
    );

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', content?.length || 0);
    res.send(content);
  } catch (error) {
    next(error);
  }
});

export { router as exportRoutes };
