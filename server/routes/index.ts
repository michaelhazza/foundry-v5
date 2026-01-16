import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './users.routes';
import { invitationRoutes } from './invitations.routes';
import { projectRoutes } from './projects.routes';
import { sourceRoutes } from './sources.routes';
import { mappingRoutes } from './mapping.routes';
import { privacyRoutes } from './privacy.routes';
import { filterRoutes } from './filters.routes';
import { processingRoutes } from './processing.routes';
import { exportRoutes } from './exports.routes';
import { activityRoutes } from './activity.routes';

const router = Router();

// Routes are registered in order: specific routes before parameterized routes

// Auth routes (public + authenticated)
router.use('/auth', authRoutes);

// User management routes
router.use('/users', userRoutes);
router.use('/invitations', invitationRoutes);

// Project routes
router.use('/projects', projectRoutes);

// Source routes (includes /api/projects/:id/sources and /api/sources/:id)
router.use('/', sourceRoutes);

// Mapping routes (includes /api/projects/:id/mapping and /api/field-mappings/:id)
router.use('/', mappingRoutes);

// Privacy routes (includes /api/projects/:id/privacy and /api/privacy-rules/:id)
router.use('/', privacyRoutes);

// Filter routes (includes /api/projects/:id/filters and /api/quality-filters/:id)
router.use('/', filterRoutes);

// Processing routes (includes /api/projects/:id/process, /api/runs/:id)
router.use('/', processingRoutes);

// Export routes (/api/exports/:id)
router.use('/exports', exportRoutes);

// Activity routes (/api/activity)
router.use('/activity', activityRoutes);

export default router;
