import { pgTable, serial, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const organisations = pgTable(
  'organisations',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('organisations_slug_idx').on(table.slug),
  })
);

export const organisationsRelations = relations(organisations, ({ many }) => ({
  users: many(users),
  projects: many(projects),
  activityLogs: many(activityLogs),
}));

// Forward declarations for relations (will be defined in other files)
import { users } from './users';
import { projects } from './projects';
import { activityLogs } from './activity';
