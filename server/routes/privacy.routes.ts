import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { privacyService } from '../services/privacy.service';
import { deidentificationService } from '../services/deidentification.service';
import { parseIntParam } from '../lib/validation';
import {
  updatePrivacyConfigSchema,
  createPrivacyRuleSchema,
  updatePrivacyRuleSchema,
} from '@shared/validators';

const router = Router();

// GET /api/projects/:projectId/privacy - Get privacy config
router.get('/projects/:projectId/privacy', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const config = await privacyService.getProjectConfig(
      req.organisationId!,
      projectId
    );
    res.json({ data: config });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:projectId/privacy - Update privacy config
router.put('/projects/:projectId/privacy', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const data = updatePrivacyConfigSchema.parse(req.body);
    const config = await privacyService.updateProjectConfig(
      req.organisationId!,
      projectId,
      data
    );
    res.json({ data: config });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/privacy/rules - Get custom rules
router.get('/projects/:projectId/privacy/rules', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const rules = await privacyService.getProjectRules(
      req.organisationId!,
      projectId
    );
    res.json({ data: rules });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/privacy/rules - Create custom rule
router.post('/projects/:projectId/privacy/rules', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const data = createPrivacyRuleSchema.parse(req.body);
    const rule = await privacyService.createRule(
      req.organisationId!,
      projectId,
      data
    );
    res.status(201).json({ data: rule });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/privacy/preview - Preview de-identification
router.post('/projects/:projectId/privacy/preview', requireAuth, async (req, res, next) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const { sampleText } = req.body;

    // Get config and rules
    const config = await privacyService.getProjectConfig(
      req.organisationId!,
      projectId
    );
    const rules = await privacyService.getProjectRules(
      req.organisationId!,
      projectId
    );

    const preview = deidentificationService.preview(sampleText || '', config, rules);
    res.json({ data: preview });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/privacy-rules/:id - Update rule
router.patch('/privacy-rules/:id', requireAuth, async (req, res, next) => {
  try {
    const ruleId = parseIntParam(req.params.id, 'id');
    const data = updatePrivacyRuleSchema.parse(req.body);
    const rule = await privacyService.updateRule(req.organisationId!, ruleId, data);
    res.json({ data: rule });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/privacy-rules/:id - Delete rule
router.delete('/privacy-rules/:id', requireAuth, async (req, res, next) => {
  try {
    const ruleId = parseIntParam(req.params.id, 'id');
    await privacyService.deleteRule(req.organisationId!, ruleId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as privacyRoutes };
