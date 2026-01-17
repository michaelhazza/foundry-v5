// Centralized query keys for React Query
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    list: () => [...queryKeys.users.all, 'list'] as const,
  },

  // Invitations
  invitations: {
    all: ['invitations'] as const,
    list: () => [...queryKeys.invitations.all, 'list'] as const,
    validate: (token: string) => [...queryKeys.invitations.all, 'validate', token] as const,
  },

  // Organisations
  organisations: {
    all: ['organisations'] as const,
    detail: (id: number) => [...queryKeys.organisations.all, id] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    list: () => [...queryKeys.projects.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.projects.all, id] as const,
  },

  // Sources
  sources: {
    all: ['sources'] as const,
    list: (projectId: number) => [...queryKeys.sources.all, 'list', projectId] as const,
    byProject: (projectId: number) => [...queryKeys.sources.all, 'project', projectId] as const,
    detail: (id: number) => [...queryKeys.sources.all, id] as const,
    preview: (id: number) => [...queryKeys.sources.all, id, 'preview'] as const,
  },

  // Mapping
  mapping: {
    all: ['mapping'] as const,
    list: (projectId: number) => [...queryKeys.mapping.all, 'list', projectId] as const,
    byProject: (projectId: number) => [...queryKeys.mapping.all, 'project', projectId] as const,
  },

  // Privacy
  privacy: {
    all: ['privacy'] as const,
    config: (projectId: number) => [...queryKeys.privacy.all, 'config', projectId] as const,
    rules: (projectId: number) => [...queryKeys.privacy.all, 'rules', projectId] as const,
  },

  // Filters
  filters: {
    all: ['filters'] as const,
    list: (projectId: number) => [...queryKeys.filters.all, 'list', projectId] as const,
    byProject: (projectId: number) => [...queryKeys.filters.all, 'project', projectId] as const,
  },

  // Processing
  processing: {
    all: ['processing'] as const,
    status: (projectId: number) => [...queryKeys.processing.all, 'status', projectId] as const,
    runs: (projectId: number) => [...queryKeys.processing.all, 'runs', projectId] as const,
    history: (projectId: number) => [...queryKeys.processing.all, 'history', projectId] as const,
  },

  // Runs
  runs: {
    all: ['runs'] as const,
    detail: (id: number) => [...queryKeys.runs.all, id] as const,
    report: (id: number) => [...queryKeys.runs.all, id, 'report'] as const,
    exports: (id: number) => [...queryKeys.runs.all, id, 'exports'] as const,
  },

  // Exports
  exports: {
    all: ['exports'] as const,
    list: (runId: number) => [...queryKeys.exports.all, 'list', runId] as const,
    detail: (id: number) => [...queryKeys.exports.all, id] as const,
  },

  // Activity
  activity: {
    all: ['activity'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.activity.all, 'list', filters] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },
};
