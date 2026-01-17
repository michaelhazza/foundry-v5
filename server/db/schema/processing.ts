import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  index,
  pgEnum,
  jsonb,
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
export const runStatusEnum = pgEnum('run_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export const exportFormatEnum = pgEnum('export_format', ['jsonl', 'qa_pairs', 'raw_json']);

// Processing runs table
export const processingRuns = pgTable(
  'processing_runs',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    status: runStatusEnum('status').default('pending').notNull(),
    progress: integer('progress').default(0).notNull(),
    totalRecords: integer('total_records'),
    recordsProcessed: integer('records_processed').default(0).notNull(),
    recordsFiltered: integer('records_filtered').default(0).notNull(),
    piiStats: jsonb('pii_stats').$type<{
      names?: number;
      emails?: number;
      phones?: number;
      addresses?: number;
      companies?: number;
      creditCards?: number;
      ssn?: number;
      customRules?: number;
    }>(),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index('processing_runs_project_idx').on(table.projectId),
    statusIdx: index('processing_runs_status_idx').on(table.status),
  })
);

export const processingRunsRelations = relations(processingRuns, ({ one, many }) => ({
  project: one(projects, {
    fields: [processingRuns.projectId],
    references: [projects.id],
  }),
  entityMappings: many(entityMappings),
  outputs: many(processingOutputs),
}));

// Entity mappings table (for consistent PII replacement)
export const entityMappings = pgTable(
  'entity_mappings',
  {
    id: serial('id').primaryKey(),
    runId: integer('run_id')
      .notNull()
      .references(() => processingRuns.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    originalValue: text('original_value').notNull(),
    replacementValue: varchar('replacement_value', { length: 200 }).notNull(),
    occurrences: integer('occurrences').default(1).notNull(),
  },
  (table) => ({
    runIdx: index('entity_mappings_run_idx').on(table.runId),
    typeIdx: index('entity_mappings_type_idx').on(table.entityType),
  })
);

export const entityMappingsRelations = relations(entityMappings, ({ one }) => ({
  run: one(processingRuns, {
    fields: [entityMappings.runId],
    references: [processingRuns.id],
  }),
}));

// Processing outputs table
export const processingOutputs = pgTable(
  'processing_outputs',
  {
    id: serial('id').primaryKey(),
    runId: integer('run_id')
      .notNull()
      .references(() => processingRuns.id, { onDelete: 'cascade' }),
    format: exportFormatEnum('format').notNull(),
    filename: varchar('filename', { length: 255 }).notNull(),
    content: bytea('content'),
    size: integer('size'),
    recordCount: integer('record_count'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    runIdx: index('processing_outputs_run_idx').on(table.runId),
  })
);

export const processingOutputsRelations = relations(processingOutputs, ({ one }) => ({
  run: one(processingRuns, {
    fields: [processingOutputs.runId],
    references: [processingRuns.id],
  }),
}));
