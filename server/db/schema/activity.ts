import { pgTable, serial, varchar, text, timestamp, integer, index, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organisations } from './organisations';
import { users } from './users';

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: serial('id').primaryKey(),
    organisationId: integer('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }),
    entityId: integer('entity_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('activity_logs_org_idx').on(table.organisationId),
    userIdx: index('activity_logs_user_idx').on(table.userId),
    actionIdx: index('activity_logs_action_idx').on(table.action),
    createdAtIdx: index('activity_logs_created_at_idx').on(table.createdAt),
  })
);

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  organisation: one(organisations, {
    fields: [activityLogs.organisationId],
    references: [organisations.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Activity action types (for reference)
export const ACTIVITY_ACTIONS = {
  // Auth
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_REGISTER: 'user.register',
  PASSWORD_RESET_REQUEST: 'password.reset_request',
  PASSWORD_RESET_COMPLETE: 'password.reset_complete',

  // Users
  USER_INVITE: 'user.invite',
  USER_ROLE_CHANGE: 'user.role_change',
  USER_DEACTIVATE: 'user.deactivate',

  // Projects
  PROJECT_CREATE: 'project.create',
  PROJECT_UPDATE: 'project.update',
  PROJECT_DELETE: 'project.delete',

  // Sources
  SOURCE_CREATE: 'source.create',
  SOURCE_DELETE: 'source.delete',
  SOURCE_REFRESH: 'source.refresh',

  // Processing
  PROCESSING_START: 'processing.start',
  PROCESSING_COMPLETE: 'processing.complete',
  PROCESSING_CANCEL: 'processing.cancel',
  PROCESSING_FAIL: 'processing.fail',

  // Exports
  EXPORT_DOWNLOAD: 'export.download',

  // Configuration
  MAPPING_UPDATE: 'mapping.update',
  PRIVACY_UPDATE: 'privacy.update',
  FILTER_CREATE: 'filter.create',
  FILTER_UPDATE: 'filter.update',
  FILTER_DELETE: 'filter.delete',
} as const;
