import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './users.routes';
import { invitationRoutes } from './invitations.routes';
import { projectRoutes } from './projects.routes';
import { sourceRoutes } from './sources.routes';

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

// Additional routes to be implemented:
// - Mapping routes (/api/projects/:id/mapping)
// - Privacy routes (/api/projects/:id/privacy)
// - Filter routes (/api/projects/:id/filters)
// - Processing routes (/api/projects/:id/process, /api/projects/:id/processing)
// - Run routes (/api/runs/:id)
// - Export routes (/api/exports/:id)
// - Activity routes (/api/activity)

export default router;
