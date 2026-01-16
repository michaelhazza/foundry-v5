import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  index,
  pgEnum,
  boolean,
  jsonb,
  real,
  customType,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { projects } from './projects';

// Custom bytea type for binary data
const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return 'bytea';
  },
});

// Enums
export const sourceTypeEnum = pgEnum('source_type', ['file', 'api']);
export const sourceStatusEnum = pgEnum('source_status', ['pending', 'ready', 'error', 'processing']);

// Sources table (base)
export const sources = pgTable(
  'sources',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    type: sourceTypeEnum('type').notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    status: sourceStatusEnum('status').default('pending').notNull(),
    recordCount: integer('record_count'),
    detectedFields: jsonb('detected_fields').$type<string[]>(),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('sources_project_idx').on(table.projectId),
  })
);

export const sourcesRelations = relations(sources, ({ one }) => ({
  project: one(projects, {
    fields: [sources.projectId],
    references: [projects.id],
  }),
  fileSource: one(fileSources),
  apiConnection: one(apiConnections),
}));

// File sources table
export const fileSources = pgTable('file_sources', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id')
    .notNull()
    .references(() => sources.id, { onDelete: 'cascade' })
    .unique(),
  content: bytea('content'),
  mimeType: varchar('mime_type', { length: 100 }),
  size: integer('size'),
  originalFilename: varchar('original_filename', { length: 255 }),
  sheetName: varchar('sheet_name', { length: 100 }),
});

export const fileSourcesRelations = relations(fileSources, ({ one }) => ({
  source: one(sources, {
    fields: [fileSources.sourceId],
    references: [sources.id],
  }),
}));

// API connections table
export const apiConnections = pgTable('api_connections', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id')
    .notNull()
    .references(() => sources.id, { onDelete: 'cascade' })
    .unique(),
  provider: varchar('provider', { length: 50 }).notNull().default('teamwork'),
  encryptedCredentials: text('encrypted_credentials'),
  config: jsonb('config').$type<{
    inboxId?: number;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }>(),
  lastSyncAt: timestamp('last_sync_at'),
});

export const apiConnectionsRelations = relations(apiConnections, ({ one }) => ({
  source: one(sources, {
    fields: [apiConnections.sourceId],
    references: [sources.id],
  }),
}));

// Field mappings table
export const fieldMappings = pgTable(
  'field_mappings',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    sourceField: varchar('source_field', { length: 200 }).notNull(),
    targetField: varchar('target_field', { length: 200 }).notNull(),
    isAutoDetected: boolean('is_auto_detected').default(false).notNull(),
    confidence: real('confidence'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('field_mappings_project_idx').on(table.projectId),
  })
);

export const fieldMappingsRelations = relations(fieldMappings, ({ one }) => ({
  project: one(projects, {
    fields: [fieldMappings.projectId],
    references: [projects.id],
  }),
}));

// Privacy configs table
export const privacyConfigs = pgTable('privacy_configs', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' })
    .unique(),
  detectNames: boolean('detect_names').default(true).notNull(),
  detectEmails: boolean('detect_emails').default(true).notNull(),
  detectPhones: boolean('detect_phones').default(true).notNull(),
  detectAddresses: boolean('detect_addresses').default(true).notNull(),
  detectCompanies: boolean('detect_companies').default(true).notNull(),
  detectCreditCards: boolean('detect_credit_cards').default(true).notNull(),
  detectSsn: boolean('detect_ssn').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const privacyConfigsRelations = relations(privacyConfigs, ({ one }) => ({
  project: one(projects, {
    fields: [privacyConfigs.projectId],
    references: [projects.id],
  }),
}));

// Privacy rules table (custom rules)
export const privacyRules = pgTable(
  'privacy_rules',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    pattern: text('pattern').notNull(),
    replacement: varchar('replacement', { length: 200 }).notNull(),
    isEnabled: boolean('is_enabled').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('privacy_rules_project_idx').on(table.projectId),
  })
);

export const privacyRulesRelations = relations(privacyRules, ({ one }) => ({
  project: one(projects, {
    fields: [privacyRules.projectId],
    references: [projects.id],
  }),
}));

// Quality filters table
export const filterTypeEnum = pgEnum('filter_type', [
  'min_messages',
  'min_words',
  'status',
  'date_range',
  'custom',
]);

export const qualityFilters = pgTable(
  'quality_filters',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    filterType: filterTypeEnum('filter_type').notNull(),
    config: jsonb('config').$type<Record<string, unknown>>().notNull(),
    isEnabled: boolean('is_enabled').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('quality_filters_project_idx').on(table.projectId),
  })
);

export const qualityFiltersRelations = relations(qualityFilters, ({ one }) => ({
  project: one(projects, {
    fields: [qualityFilters.projectId],
    references: [projects.id],
  }),
}));
