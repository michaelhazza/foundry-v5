import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { processingLimiter } from '../middleware/rate-limit';
import { processingService } from '../services/processing.service';
import { parseIntParam } from '../lib/validation';

const router = Router();

// POST /api/projects/:projectId/process - Start processing
router.post(
  '/projects/:projectId/process',
  requireAuth,
  processingLimiter,
  async (req, res, next) => {
    try {
      const projectId = parseIntParam(req.params.projectId, 'projectId');
      const run = await processingService.startProcessing(
        req.organisationId!,
        projectId
      );
      res.status(202).json({ data: run });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/projects/:projectId/processing - Get current status
router.get('/projects/:projectId/processing', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const status = await processingService.getStatus(req.organisationId!, projectId);
    res.json({ data: status });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/processing/cancel - Cancel processing
router.post('/projects/:projectId/processing/cancel', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const run = await processingService.cancelProcessing(
      req.organisationId!,
      projectId
    );
    res.json({ data: run });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/runs - Get processing history
router.get('/projects/:projectId/runs', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const history = await processingService.getHistory(
      req.organisationId!,
      projectId
    );
    res.json({ data: history });
  } catch (error) {
    next(error);
  }
});

// GET /api/runs/:id - Get run details
router.get('/runs/:id', requireAuth, async (req, res, next) => {
  try {
    const runId = parseIntParam(req.params.id, 'id');
    const run = await processingService.getRunDetails(req.organisationId!, runId);
    res.json({ data: run });
  } catch (error) {
    next(error);
  }
});

// GET /api/runs/:id/exports - Get run exports
router.get('/runs/:id/exports', requireAuth, async (req, res, next) => {
  try {
    const runId = parseIntParam(req.params.id, 'id');
    const exports = await processingService.getRunExports(
      req.organisationId!,
      runId
    );
    res.json({ data: exports });
  } catch (error) {
    next(error);
  }
});

// GET /api/runs/:id/report - Get processing report with detailed statistics
router.get('/runs/:id/report', requireAuth, async (req, res, next) => {
  try {
    const runId = parseIntParam(req.params.id, 'id');
    const run = await processingService.getRunDetails(req.organisationId!, runId);

    const totalRecords = run.totalRecords || 0;
    const recordsProcessed = run.recordsProcessed || 0;
    const recordsFiltered = run.recordsFiltered || 0;

    // Compile report with statistics
    const report = {
      run: {
        id: run.id,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
      },
      statistics: {
        totalRecords,
        processedRecords: recordsProcessed,
        filteredRecords: recordsFiltered,
        processingRate: totalRecords > 0
          ? ((recordsProcessed / totalRecords) * 100).toFixed(2) + '%'
          : '0%',
        filterRate: totalRecords > 0
          ? ((recordsFiltered / totalRecords) * 100).toFixed(2) + '%'
          : '0%',
      },
      deidentification: run.piiStats || {},
      duration: run.startedAt && run.completedAt
        ? Math.round(
            (new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000
          )
        : null,
    };

    res.json({ data: report });
  } catch (error) {
    next(error);
  }
});

export { router as processingRoutes };
