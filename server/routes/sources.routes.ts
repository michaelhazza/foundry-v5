import { Router } from 'express';
import multer from 'multer';
import { db } from '../db';
import { sources, fileSources, apiConnections, projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { NotFoundError, BadRequestError, ERROR_CODES } from '../errors';
import { parseIntParam } from '../lib/validation';
import { sourceService } from '../services/source.service';

const router = Router();

// Configure multer for file uploads (50MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/csv',
      'application/json',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`Invalid file type: ${file.mimetype}`, {
        code: ERROR_CODES.INVALID_FILE_TYPE,
        allowedTypes,
      }) as any);
    }
  },
});

// GET /api/projects/:projectId/sources - List project sources
router.get('/projects/:projectId/sources', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const sourceList = await sourceService.getProjectSources(req.organisationId!, projectId);
    res.json({ data: sourceList });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/sources/file - Upload file source
router.post(
  '/projects/:projectId/sources/file',
  requireAuth,
  upload.single('file'),
  async (req, res, next) => {
    try {
      const projectId = parseIntParam(req.params.projectId, 'projectId');

      if (!req.file) {
        throw new BadRequestError('No file provided');
      }

      const { name, sheetName } = req.body;
      const sourceName = name || req.file.originalname;

      const source = await sourceService.createFileSource(req.organisationId!, {
        projectId,
        name: sourceName,
        content: req.file.buffer,
        mimeType: req.file.mimetype,
        originalFilename: req.file.originalname,
        sheetName,
      });

      res.status(201).json({ data: source });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/projects/:projectId/sources/api - Create API source
router.post('/projects/:projectId/sources/api', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const { name, provider, domain, apiKey, config } = req.body;

    if (!name || !provider || !domain || !apiKey) {
      throw new BadRequestError('Missing required fields: name, provider, domain, apiKey');
    }

    // Encrypt credentials (simple base64 for now, should use proper encryption)
    const credentials = JSON.stringify({ domain, apiKey });
    const encryptedCredentials = Buffer.from(credentials).toString('base64');

    const source = await sourceService.createApiSource(req.organisationId!, {
      projectId,
      name,
      provider,
      encryptedCredentials,
      config,
    });

    res.status(201).json({ data: source });
  } catch (error) {
    next(error);
  }
});

// GET /api/sources/:id - Get source details
router.get('/sources/:id', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseIntParam(req.params.id, 'id');
    const source = await sourceService.getSource(req.organisationId!, sourceId);
    res.json({ data: source });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sources/:id - Delete source
router.delete('/sources/:id', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseIntParam(req.params.id, 'id');
    await sourceService.deleteSource(req.organisationId!, sourceId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /api/sources/:id/preview - Preview source data
router.get('/sources/:id/preview', requireAuth, async (req, res, next) => {
  try {
    const sourceId = parseIntParam(req.params.id, 'id');
    const limit = parseInt(req.query.limit as string) || 10;
    const preview = await sourceService.getSourcePreview(req.organisationId!, sourceId, limit);
    res.json({ data: preview });
  } catch (error) {
    next(error);
  }
});

export { router as sourceRoutes };
