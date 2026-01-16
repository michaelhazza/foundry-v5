import { pgTable, serial, varchar, timestamp, boolean, integer, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organisations } from './organisations';

export const userRoleEnum = pgEnum('user_role', ['admin', 'member']);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    organisationId: integer('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    role: userRoleEnum('role').default('member').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgEmailIdx: uniqueIndex('users_org_email_idx').on(table.organisationId, table.email),
  })
);

export const usersRelations = relations(users, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [users.organisationId],
    references: [organisations.id],
  }),
  invitations: many(invitations),
  passwordResetTokens: many(passwordResetTokens),
  projectsCreated: many(projects),
  activityLogs: many(activityLogs),
}));

// Invitations table
export const invitations = pgTable(
  'invitations',
  {
    id: serial('id').primaryKey(),
    organisationId: integer('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    role: userRoleEnum('role').default('member').notNull(),
    token: varchar('token', { length: 64 }).notNull().unique(),
    invitedById: integer('invited_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at').notNull(),
    acceptedAt: timestamp('accepted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex('invitations_token_idx').on(table.token),
  })
);

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organisation: one(organisations, {
    fields: [invitations.organisationId],
    references: [organisations.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedById],
    references: [users.id],
  }),
}));

// Password reset tokens table
export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex('password_reset_tokens_token_idx').on(table.token),
  })
);

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// Forward declarations for relations
import { projects } from './projects';
import { activityLogs } from './activity';
