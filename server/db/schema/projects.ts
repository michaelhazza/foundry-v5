import { pgTable, serial, varchar, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organisations } from './organisations';
import { users } from './users';

export const projects = pgTable(
  'projects',
  {
    id: serial('id').primaryKey(),
    organisationId: integer('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    createdById: integer('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('projects_organisation_idx').on(table.organisationId),
  })
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [projects.organisationId],
    references: [organisations.id],
  }),
  createdBy: one(users, {
    fields: [projects.createdById],
    references: [users.id],
  }),
  sources: many(sources),
  fieldMappings: many(fieldMappings),
  privacyConfig: one(privacyConfigs),
  privacyRules: many(privacyRules),
  qualityFilters: many(qualityFilters),
  processingRuns: many(processingRuns),
}));

// Forward declarations
import { sources, fieldMappings, privacyConfigs, privacyRules, qualityFilters } from './sources';
import { processingRuns } from './processing';
