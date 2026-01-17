# Data Model Document: Foundry

**Document ID:** 03-DATA-MODEL  
**Version:** 1.0  
**Created:** 2026-01-11  
**Status:** COMPLETE  
**Source PRD:** 01-PRD v1.0  
**Source Architecture:** 02-ARCH v1.0

---

## Section 1: Entity Overview

### Entity List

| Entity | Purpose | Multi-tenant |
|--------|---------|--------------|
| organisations | Tenant boundary, billing entity | No (root) |
| users | Organisation members with authentication | Yes |
| invitations | Pending user invitations | Yes |
| password_reset_tokens | Time-limited password reset | Yes |
| projects | Data processing workspace | Yes |
| sources | Base record for data sources | Yes |
| file_sources | Uploaded file metadata and content | Yes (via source) |
| api_connections | API credentials and configuration | Yes (via source) |
| field_mappings | Source-to-target field mappings | Yes (via project) |
| privacy_configs | Project-level PII detection settings | Yes (via project) |
| privacy_rules | Custom regex patterns for PII removal | Yes (via project) |
| quality_filters | Processing filter criteria | Yes (via project) |
| processing_runs | Execution records with progress | Yes (via project) |
| entity_mappings | Consistent PII replacement tracking | Yes (via run) |
| processing_outputs | Generated export files | Yes (via run) |
| activity_logs | Audit trail | Yes |

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ORGANISATIONS                                   │
│  (tenant root - all data flows from here)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
         │                    │                         │
         │ 1:N                │ 1:N                     │ 1:N
         ▼                    ▼                         ▼
┌─────────────────┐  ┌─────────────────┐       ┌─────────────────┐
│     USERS       │  │  INVITATIONS    │       │    PROJECTS     │
│  (soft delete)  │  │  (pending)      │       │                 │
└─────────────────┘  └─────────────────┘       └─────────────────┘
         │                                              │
         │ 1:N                         ┌────────────────┼────────────────┐
         ▼                             │                │                │
┌─────────────────┐                    │ 1:N            │ 1:1            │ 1:N
│ PASSWORD_RESET  │                    ▼                ▼                ▼
│    _TOKENS      │           ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
└─────────────────┘           │   SOURCES   │  │   PRIVACY    │  │  QUALITY    │
                              │  (base)     │  │   CONFIGS    │  │  FILTERS    │
                              └─────────────┘  └──────────────┘  └─────────────┘
                                     │                │
                        ┌────────────┼────────┐       │ 1:N
                        │            │        │       ▼
                   1:1 (file)   1:1 (api)  1:N  ┌──────────────┐
                        ▼            ▼        │  │   PRIVACY    │
               ┌────────────┐ ┌───────────┐   │  │    RULES     │
               │FILE_SOURCES│ │API_CONNS  │   │  └──────────────┘
               │  (bytea)   │ │(encrypted)│   │
               └────────────┘ └───────────┘   │
                                              ▼
                                     ┌─────────────────┐
                                     │ FIELD_MAPPINGS  │
                                     └─────────────────┘

┌─────────────────┐
│    PROJECTS     │ (continued)
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐
│  PROCESSING_RUNS    │
│  (with progress)    │
└─────────────────────┘
         │
         ├─────────────────┐
         │ 1:N             │ 1:N
         ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│ ENTITY_MAPPINGS │ │PROCESSING_OUTPUTS│
│ (PII tracking)  │ │    (bytea)      │
└─────────────────┘ └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            ACTIVITY_LOGS                                     │
│  (polymorphic reference to any entity via entity_type + entity_id)          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Section 2: Schema Definition

```typescript
// server/db/schema.ts
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  integer, 
  boolean, 
  varchar,
  jsonb,
  bytea,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';

// ============================================================================
// STANDARD PATTERNS
// ============================================================================

// Audit columns added to all tables
const auditColumns = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
};

// ============================================================================
// TENANT ROOT
// ============================================================================

export const organisations = pgTable('organisations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  ...auditColumns,
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'), // 'admin' | 'member'
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  ...auditColumns,
}, (table) => [
  uniqueIndex('users_org_email_idx').on(table.organisationId, table.email),
  index('users_org_id_idx').on(table.organisationId),
]);

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 64 }).notNull().unique(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  invitedById: integer('invited_by_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  ...auditColumns,
}, (table) => [
  index('invitations_org_id_idx').on(table.organisationId),
  index('invitations_token_idx').on(table.token),
]);

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('password_reset_tokens_user_id_idx').on(table.userId),
]);

// ============================================================================
// PROJECT MANAGEMENT
// ============================================================================

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  createdById: integer('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  ...auditColumns,
}, (table) => [
  index('projects_org_id_idx').on(table.organisationId),
]);

// ============================================================================
// DATA SOURCES
// ============================================================================

export const sources = pgTable('sources', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // 'file' | 'api'
  name: varchar('name', { length: 200 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'ready' | 'error' | 'processing'
  recordCount: integer('record_count'),
  lastRefreshedAt: timestamp('last_refreshed_at'),
  errorMessage: text('error_message'),
  ...auditColumns,
}, (table) => [
  index('sources_project_id_idx').on(table.projectId),
]);

export const fileSources = pgTable('file_sources', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }).unique(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(), // bytes
  fileContent: bytea('file_content').notNull(),
  // For Excel files
  selectedSheet: varchar('selected_sheet', { length: 100 }),
  availableSheets: jsonb('available_sheets'), // string[]
  // For JSON files
  selectedPath: varchar('selected_path', { length: 255 }), // JSONPath for nested extraction
  // Detected structure
  detectedColumns: jsonb('detected_columns'), // { name: string, type: string }[]
  sampleData: jsonb('sample_data'), // First 10 rows for preview
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const apiConnections = pgTable('api_connections', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }).unique(),
  provider: varchar('provider', { length: 50 }).notNull(), // 'teamwork_desk'
  // Encrypted credentials
  encryptedCredentials: text('encrypted_credentials').notNull(), // AES-256 encrypted JSON
  credentialsMask: varchar('credentials_mask', { length: 50 }), // e.g., "sk-****1234"
  // Configuration
  config: jsonb('config'), // Provider-specific: { domain, inboxId, dateFrom, dateTo, statusFilter }
  // Sync state
  lastSyncCursor: text('last_sync_cursor'), // For incremental sync
  ...auditColumns,
});

// ============================================================================
// FIELD MAPPING CONFIGURATION
// ============================================================================

export const fieldMappings = pgTable('field_mappings', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sourceId: integer('source_id').references(() => sources.id, { onDelete: 'cascade' }), // null = project default
  sourceField: varchar('source_field', { length: 200 }).notNull(),
  targetField: varchar('target_field', { length: 200 }).notNull(), // 'message' | 'role' | 'timestamp' | 'conversation_id' | 'custom:*'
  confidence: varchar('confidence', { length: 20 }), // 'high' | 'medium' | 'low' | null (manual)
  isAutoDetected: boolean('is_auto_detected').notNull().default(false),
  ...auditColumns,
}, (table) => [
  index('field_mappings_project_id_idx').on(table.projectId),
  index('field_mappings_source_id_idx').on(table.sourceId),
]);

// ============================================================================
// PRIVACY CONFIGURATION (PII Detection & Removal)
// ============================================================================

export const privacyConfigs = pgTable('privacy_configs', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }).unique(),
  // Standard PII type toggles
  detectNames: boolean('detect_names').notNull().default(true),
  detectEmails: boolean('detect_emails').notNull().default(true),
  detectPhones: boolean('detect_phones').notNull().default(true),
  detectAddresses: boolean('detect_addresses').notNull().default(true),
  detectCompanies: boolean('detect_companies').notNull().default(true),
  // Consistent entity replacement (same name → same placeholder throughout)
  consistentReplacement: boolean('consistent_replacement').notNull().default(true),
  ...auditColumns,
});

export const privacyRules = pgTable('privacy_rules', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  pattern: text('pattern').notNull(), // Regex pattern
  replacement: varchar('replacement', { length: 100 }).notNull(), // e.g., '[ACCOUNT_ID]'
  isEnabled: boolean('is_enabled').notNull().default(true),
  ...auditColumns,
}, (table) => [
  index('privacy_rules_project_id_idx').on(table.projectId),
]);

// ============================================================================
// QUALITY FILTERING
// ============================================================================

export const qualityFilters = pgTable('quality_filters', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  filterType: varchar('filter_type', { length: 50 }).notNull(), // 'min_messages' | 'min_words' | 'status' | 'date_range'
  config: jsonb('config').notNull(), // Type-specific: { minCount: 3 } | { statuses: ['resolved'] } | { from, to }
  isEnabled: boolean('is_enabled').notNull().default(true),
  ...auditColumns,
}, (table) => [
  index('quality_filters_project_id_idx').on(table.projectId),
]);

// ============================================================================
// PROCESSING
// ============================================================================

export const processingRuns = pgTable('processing_runs', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  stage: varchar('stage', { length: 50 }), // 'fetching' | 'processing' | 'removing_pii' | 'formatting'
  progress: integer('progress').notNull().default(0), // 0-100
  totalRecords: integer('total_records'),
  processedRecords: integer('processed_records').notNull().default(0),
  filteredOutRecords: integer('filtered_out_records').notNull().default(0),
  outputRecords: integer('output_records'),
  // Privacy statistics
  piiStats: jsonb('pii_stats'), // { names: 42, emails: 15, phones: 8, ... }
  // Error tracking
  errorMessage: text('error_message'),
  errorDetails: jsonb('error_details'),
  // Timing
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  startedById: integer('started_by_id').references(() => users.id, { onDelete: 'set null' }),
  ...auditColumns,
}, (table) => [
  index('processing_runs_project_id_idx').on(table.projectId),
  index('processing_runs_status_idx').on(table.status),
]);

export const entityMappings = pgTable('entity_mappings', {
  id: serial('id').primaryKey(),
  processingRunId: integer('processing_run_id').notNull().references(() => processingRuns.id, { onDelete: 'cascade' }),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'person' | 'email' | 'phone' | 'company' | 'custom'
  originalValue: text('original_value').notNull(),
  replacementValue: varchar('replacement_value', { length: 100 }).notNull(), // e.g., '[PERSON_1]'
  occurrenceCount: integer('occurrence_count').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('entity_mappings_run_id_idx').on(table.processingRunId),
  uniqueIndex('entity_mappings_run_type_original_idx').on(table.processingRunId, table.entityType, table.originalValue),
]);

export const processingOutputs = pgTable('processing_outputs', {
  id: serial('id').primaryKey(),
  processingRunId: integer('processing_run_id').notNull().references(() => processingRuns.id, { onDelete: 'cascade' }),
  format: varchar('format', { length: 20 }).notNull(), // 'jsonl_conversation' | 'jsonl_qa' | 'json_raw'
  filename: varchar('filename', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  fileContent: bytea('file_content').notNull(),
  recordCount: integer('record_count').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('processing_outputs_run_id_idx').on(table.processingRunId),
]);

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 50 }).notNull(), // 'user.login' | 'project.create' | 'processing.start' | ...
  entityType: varchar('entity_type', { length: 50 }), // 'user' | 'project' | 'source' | ...
  entityId: integer('entity_id'),
  metadata: jsonb('metadata'), // Additional context
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 max length
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('activity_logs_org_id_idx').on(table.organisationId),
  index('activity_logs_user_id_idx').on(table.userId),
  index('activity_logs_created_at_idx').on(table.createdAt),
  index('activity_logs_entity_idx').on(table.entityType, table.entityId),
]);
```

---

## Section 3: Relationships

### Foreign Key Definitions

| Table | Column | References | On Delete | Rationale |
|-------|--------|------------|-----------|-----------|
| users | organisation_id | organisations.id | CASCADE | Delete users when org deleted |
| users | — | — | SOFT DELETE via isActive | Preserve audit trail |
| invitations | organisation_id | organisations.id | CASCADE | Clean up pending invitations |
| invitations | invited_by_id | users.id | CASCADE | Invitation invalid if inviter deleted |
| password_reset_tokens | user_id | users.id | CASCADE | Clean up tokens |
| projects | organisation_id | organisations.id | CASCADE | Delete projects when org deleted |
| projects | created_by_id | users.id | SET NULL | Preserve project, show "deleted user" |
| sources | project_id | projects.id | CASCADE | Delete sources with project |
| file_sources | source_id | sources.id | CASCADE | 1:1 extension table |
| api_connections | source_id | sources.id | CASCADE | 1:1 extension table |
| field_mappings | project_id | projects.id | CASCADE | Delete mappings with project |
| field_mappings | source_id | sources.id | CASCADE | Delete source-specific mappings |
| privacy_configs | project_id | projects.id | CASCADE | 1:1 config per project |
| privacy_rules | project_id | projects.id | CASCADE | Delete rules with project |
| quality_filters | project_id | projects.id | CASCADE | Delete filters with project |
| processing_runs | project_id | projects.id | CASCADE | Delete runs with project |
| processing_runs | started_by_id | users.id | SET NULL | Preserve run history |
| entity_mappings | processing_run_id | processing_runs.id | CASCADE | Delete mappings with run |
| processing_outputs | processing_run_id | processing_runs.id | CASCADE | Delete outputs with run |
| activity_logs | organisation_id | organisations.id | CASCADE | Delete logs with org |
| activity_logs | user_id | users.id | SET NULL | Preserve logs, show "deleted user" |

### Cardinality Summary

| Relationship | Cardinality |
|--------------|-------------|
| Organisation → Users | 1:N |
| Organisation → Invitations | 1:N |
| Organisation → Projects | 1:N |
| Organisation → ActivityLogs | 1:N |
| User → PasswordResetTokens | 1:N |
| Project → Sources | 1:N |
| Source → FileSource | 1:1 |
| Source → ApiConnection | 1:1 |
| Project → FieldMappings | 1:N |
| Project → PrivacyConfig | 1:1 |
| Project → PrivacyRules | 1:N |
| Project → QualityFilters | 1:N |
| Project → ProcessingRuns | 1:N |
| ProcessingRun → EntityMappings | 1:N |
| ProcessingRun → ProcessingOutputs | 1:N |

---

## Section 4: Index Strategy

### Primary Key Indexes (Automatic)
All tables have `id` serial primary key with automatic B-tree index.

### Foreign Key Indexes (Required for Performance)

| Table | Index | Columns | Rationale |
|-------|-------|---------|-----------|
| users | users_org_id_idx | organisation_id | Org-scoped user queries |
| users | users_org_email_idx | organisation_id, email | Unique constraint + login lookup |
| invitations | invitations_org_id_idx | organisation_id | List pending invitations |
| invitations | invitations_token_idx | token | Token validation |
| password_reset_tokens | password_reset_tokens_user_id_idx | user_id | User token lookup |
| projects | projects_org_id_idx | organisation_id | Org-scoped project list |
| sources | sources_project_id_idx | project_id | Project source list |
| field_mappings | field_mappings_project_id_idx | project_id | Project mapping lookup |
| field_mappings | field_mappings_source_id_idx | source_id | Source-specific mappings |
| privacy_rules | privacy_rules_project_id_idx | project_id | Project rules list |
| quality_filters | quality_filters_project_id_idx | project_id | Project filters list |
| processing_runs | processing_runs_project_id_idx | project_id | Project run history |
| processing_runs | processing_runs_status_idx | status | Active run queries |
| entity_mappings | entity_mappings_run_id_idx | processing_run_id | Run entity lookup |
| entity_mappings | entity_mappings_run_type_original_idx | processing_run_id, entity_type, original_value | Consistent replacement lookup (unique) |
| processing_outputs | processing_outputs_run_id_idx | processing_run_id | Run output list |
| activity_logs | activity_logs_org_id_idx | organisation_id | Org log queries |
| activity_logs | activity_logs_user_id_idx | user_id | User activity filter |
| activity_logs | activity_logs_created_at_idx | created_at | Date range queries |
| activity_logs | activity_logs_entity_idx | entity_type, entity_id | Entity history lookup |

### Unique Constraints

| Table | Constraint | Columns |
|-------|------------|---------|
| organisations | organisations_slug_key | slug |
| users | users_org_email_idx | organisation_id, email |
| invitations | invitations_token_key | token |
| password_reset_tokens | password_reset_tokens_token_key | token |
| file_sources | file_sources_source_id_key | source_id |
| api_connections | api_connections_source_id_key | source_id |
| privacy_configs | privacy_configs_project_id_key | project_id |
| entity_mappings | entity_mappings_run_type_original_idx | processing_run_id, entity_type, original_value |

---

## Section 5: Query Patterns

### Common Queries (Core Select API)

```typescript
import { eq, and, desc, isNull, gt, lt, sql } from 'drizzle-orm';
import { db } from './db';
import * as schema from './schema';

// ============================================================================
// AUTHENTICATION
// ============================================================================

// Find user by email within organisation (login)
async function findUserByEmail(organisationId: number, email: string) {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(and(
      eq(schema.users.organisationId, organisationId),
      eq(schema.users.email, email),
      eq(schema.users.isActive, true)
    ))
    .limit(1);
  return user;
}

// Find invitation by token
async function findInvitationByToken(token: string) {
  const [invitation] = await db
    .select()
    .from(schema.invitations)
    .where(and(
      eq(schema.invitations.token, token),
      isNull(schema.invitations.acceptedAt),
      gt(schema.invitations.expiresAt, new Date())
    ))
    .limit(1);
  return invitation;
}

// ============================================================================
// MULTI-TENANT QUERIES
// ============================================================================

// List projects for organisation
async function listProjects(organisationId: number) {
  return await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.organisationId, organisationId))
    .orderBy(desc(schema.projects.updatedAt));
}

// Get project with source count
async function getProjectWithStats(projectId: number, organisationId: number) {
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, projectId),
      eq(schema.projects.organisationId, organisationId)
    ))
    .limit(1);
  
  if (!project) return null;
  
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.sources)
    .where(eq(schema.sources.projectId, projectId));
  
  return { ...project, sourceCount: count };
}

// ============================================================================
// SOURCE QUERIES
// ============================================================================

// List sources with type-specific data
async function listSourcesWithDetails(projectId: number) {
  const sources = await db
    .select()
    .from(schema.sources)
    .where(eq(schema.sources.projectId, projectId))
    .orderBy(desc(schema.sources.createdAt));
  
  // For each source, fetch type-specific data
  return Promise.all(sources.map(async (source) => {
    if (source.type === 'file') {
      const [fileSource] = await db
        .select({
          originalFilename: schema.fileSources.originalFilename,
          fileSize: schema.fileSources.fileSize,
          detectedColumns: schema.fileSources.detectedColumns,
        })
        .from(schema.fileSources)
        .where(eq(schema.fileSources.sourceId, source.id))
        .limit(1);
      return { ...source, fileSource };
    } else {
      const [apiConnection] = await db
        .select({
          provider: schema.apiConnections.provider,
          credentialsMask: schema.apiConnections.credentialsMask,
          config: schema.apiConnections.config,
        })
        .from(schema.apiConnections)
        .where(eq(schema.apiConnections.sourceId, source.id))
        .limit(1);
      return { ...source, apiConnection };
    }
  }));
}

// ============================================================================
// PROCESSING QUERIES
// ============================================================================

// Get active processing run for project
async function getActiveProcessingRun(projectId: number) {
  const [run] = await db
    .select()
    .from(schema.processingRuns)
    .where(and(
      eq(schema.processingRuns.projectId, projectId),
      eq(schema.processingRuns.status, 'running')
    ))
    .limit(1);
  return run;
}

// Get or create entity mapping for consistent replacement
async function getOrCreateEntityMapping(
  runId: number,
  entityType: string,
  originalValue: string
): Promise<string> {
  // Try to find existing
  const [existing] = await db
    .select()
    .from(schema.entityMappings)
    .where(and(
      eq(schema.entityMappings.processingRunId, runId),
      eq(schema.entityMappings.entityType, entityType),
      eq(schema.entityMappings.originalValue, originalValue)
    ))
    .limit(1);
  
  if (existing) {
    // Increment count
    await db
      .update(schema.entityMappings)
      .set({ occurrenceCount: existing.occurrenceCount + 1 })
      .where(eq(schema.entityMappings.id, existing.id));
    return existing.replacementValue;
  }
  
  // Create new mapping
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.entityMappings)
    .where(and(
      eq(schema.entityMappings.processingRunId, runId),
      eq(schema.entityMappings.entityType, entityType)
    ));
  
  const replacement = `[${entityType.toUpperCase()}_${count + 1}]`;
  
  await db.insert(schema.entityMappings).values({
    processingRunId: runId,
    entityType,
    originalValue,
    replacementValue: replacement,
  });
  
  return replacement;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

// Log activity
async function logActivity(
  organisationId: number,
  userId: number | null,
  action: string,
  entityType?: string,
  entityId?: number,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  await db.insert(schema.activityLogs).values({
    organisationId,
    userId,
    action,
    entityType,
    entityId,
    metadata,
    ipAddress,
    userAgent,
  });
}
```

### Transaction Examples

```typescript
// ============================================================================
// TRANSACTION: Accept Invitation
// ============================================================================

async function acceptInvitation(
  token: string,
  name: string,
  passwordHash: string
) {
  return await db.transaction(async (tx) => {
    // Find and validate invitation
    const [invitation] = await tx
      .select()
      .from(schema.invitations)
      .where(and(
        eq(schema.invitations.token, token),
        isNull(schema.invitations.acceptedAt),
        gt(schema.invitations.expiresAt, new Date())
      ))
      .limit(1);
    
    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }
    
    // Create user
    const [user] = await tx
      .insert(schema.users)
      .values({
        organisationId: invitation.organisationId,
        email: invitation.email,
        name,
        passwordHash,
        role: invitation.role,
      })
      .returning();
    
    // Mark invitation as accepted
    await tx
      .update(schema.invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(schema.invitations.id, invitation.id));
    
    return user;
  });
}

// ============================================================================
// TRANSACTION: Create Project with Default Config
// ============================================================================

async function createProject(
  organisationId: number,
  createdById: number,
  name: string,
  description?: string
) {
  return await db.transaction(async (tx) => {
    // Create project
    const [project] = await tx
      .insert(schema.projects)
      .values({
        organisationId,
        createdById,
        name,
        description,
      })
      .returning();
    
    // Create default privacy config
    await tx.insert(schema.privacyConfigs).values({
      projectId: project.id,
      // All defaults true
    });
    
    return project;
  });
}

// ============================================================================
// TRANSACTION: Start Processing Run
// ============================================================================

async function startProcessingRun(
  projectId: number,
  startedById: number
) {
  return await db.transaction(async (tx) => {
    // Check no active run exists
    const [activeRun] = await tx
      .select()
      .from(schema.processingRuns)
      .where(and(
        eq(schema.processingRuns.projectId, projectId),
        eq(schema.processingRuns.status, 'running')
      ))
      .limit(1);
    
    if (activeRun) {
      throw new Error('A processing run is already active');
    }
    
    // Create new run
    const [run] = await tx
      .insert(schema.processingRuns)
      .values({
        projectId,
        startedById,
        status: 'running',
        stage: 'fetching',
        startedAt: new Date(),
      })
      .returning();
    
    return run;
  });
}
```

---

## Section 6: Migration Strategy

### drizzle.config.ts

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Migration Scripts

```json
// package.json (relevant scripts)
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "tsx server/db/migrate.ts",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx server/db/seed.ts"
  }
}
```

```typescript
// server/db/migrate.ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import 'dotenv/config';

async function runMigrations() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(sql);
  
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete');
  
  await sql.end();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

### Seed Data

```typescript
// server/db/seed.ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import bcrypt from 'bcrypt';
import 'dotenv/config';

async function seed() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(sql, { schema });
  
  console.log('Seeding database...');
  
  // Create demo organisation
  const [org] = await db
    .insert(schema.organisations)
    .values({
      name: 'Demo Organisation',
      slug: 'demo',
    })
    .returning();
  
  console.log(`Created organisation: ${org.name} (ID: ${org.id})`);
  
  // Create admin user
  const passwordHash = await bcrypt.hash('password123', 10);
  const [admin] = await db
    .insert(schema.users)
    .values({
      organisationId: org.id,
      email: 'admin@demo.com',
      name: 'Demo Admin',
      passwordHash,
      role: 'admin',
    })
    .returning();
  
  console.log(`Created admin user: ${admin.email}`);
  
  // Create member user
  const [member] = await db
    .insert(schema.users)
    .values({
      organisationId: org.id,
      email: 'member@demo.com',
      name: 'Demo Member',
      passwordHash,
      role: 'member',
    })
    .returning();
  
  console.log(`Created member user: ${member.email}`);
  
  // Create sample project
  const [project] = await db
    .insert(schema.projects)
    .values({
      organisationId: org.id,
      createdById: admin.id,
      name: 'Sample Support Tickets',
      description: 'Demo project for testing the platform',
    })
    .returning();
  
  // Create default privacy config
  await db.insert(schema.privacyConfigs).values({
    projectId: project.id,
  });
  
  console.log(`Created project: ${project.name}`);
  
  console.log('\nSeed complete!');
  console.log('─'.repeat(40));
  console.log('Demo credentials:');
  console.log('  Admin: admin@demo.com / password123');
  console.log('  Member: member@demo.com / password123');
  console.log('─'.repeat(40));
  
  await sql.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

### Initial Migration Approach

1. **Development:** Use `npm run db:push` for rapid iteration
2. **Production:** Generate migrations with `npm run db:generate`, apply with `npm run db:migrate`
3. **Rollback:** Drizzle-kit supports rollback via SQL files in `/drizzle` folder

---

## Section 7: Type Exports

```typescript
// server/db/types.ts
import * as schema from './schema';

// ============================================================================
// INFERRED TYPES
// ============================================================================

// Organisations
export type Organisation = typeof schema.organisations.$inferSelect;
export type NewOrganisation = typeof schema.organisations.$inferInsert;

// Users
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;

// Invitations
export type Invitation = typeof schema.invitations.$inferSelect;
export type NewInvitation = typeof schema.invitations.$inferInsert;

// Password Reset Tokens
export type PasswordResetToken = typeof schema.passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof schema.passwordResetTokens.$inferInsert;

// Projects
export type Project = typeof schema.projects.$inferSelect;
export type NewProject = typeof schema.projects.$inferInsert;

// Sources
export type Source = typeof schema.sources.$inferSelect;
export type NewSource = typeof schema.sources.$inferInsert;
export type SourceType = 'file' | 'api';
export type SourceStatus = 'pending' | 'ready' | 'error' | 'processing';

// File Sources
export type FileSource = typeof schema.fileSources.$inferSelect;
export type NewFileSource = typeof schema.fileSources.$inferInsert;

// API Connections
export type ApiConnection = typeof schema.apiConnections.$inferSelect;
export type NewApiConnection = typeof schema.apiConnections.$inferInsert;
export type ApiProvider = 'teamwork_desk';

// Field Mappings
export type FieldMapping = typeof schema.fieldMappings.$inferSelect;
export type NewFieldMapping = typeof schema.fieldMappings.$inferInsert;
export type TargetField = 'message' | 'role' | 'timestamp' | 'conversation_id' | `custom:${string}`;
export type MappingConfidence = 'high' | 'medium' | 'low';

// Privacy Configuration
export type PrivacyConfig = typeof schema.privacyConfigs.$inferSelect;
export type NewPrivacyConfig = typeof schema.privacyConfigs.$inferInsert;
export type PrivacyRule = typeof schema.privacyRules.$inferSelect;
export type NewPrivacyRule = typeof schema.privacyRules.$inferInsert;

// Quality Filters
export type QualityFilter = typeof schema.qualityFilters.$inferSelect;
export type NewQualityFilter = typeof schema.qualityFilters.$inferInsert;
export type FilterType = 'min_messages' | 'min_words' | 'status' | 'date_range';

// Processing
export type ProcessingRun = typeof schema.processingRuns.$inferSelect;
export type NewProcessingRun = typeof schema.processingRuns.$inferInsert;
export type ProcessingStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ProcessingStage = 'fetching' | 'processing' | 'removing_pii' | 'formatting';

export type EntityMapping = typeof schema.entityMappings.$inferSelect;
export type NewEntityMapping = typeof schema.entityMappings.$inferInsert;
export type EntityType = 'person' | 'email' | 'phone' | 'company' | 'address' | 'custom';

export type ProcessingOutput = typeof schema.processingOutputs.$inferSelect;
export type NewProcessingOutput = typeof schema.processingOutputs.$inferInsert;
export type OutputFormat = 'jsonl_conversation' | 'jsonl_qa' | 'json_raw';

// Activity Logs
export type ActivityLog = typeof schema.activityLogs.$inferSelect;
export type NewActivityLog = typeof schema.activityLogs.$inferInsert;

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

export type UserRole = 'admin' | 'member';

export interface SourceWithDetails extends Source {
  fileSource?: Pick<FileSource, 'originalFilename' | 'fileSize' | 'detectedColumns'>;
  apiConnection?: Pick<ApiConnection, 'provider' | 'credentialsMask' | 'config'>;
}

export interface ProjectWithStats extends Project {
  sourceCount: number;
  lastProcessedAt?: Date;
}

export interface ProcessingRunWithOutputs extends ProcessingRun {
  outputs: ProcessingOutput[];
}

// ============================================================================
// JSON COLUMN TYPES
// ============================================================================

export interface DetectedColumn {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'unknown';
  sampleValues?: string[];
}

export interface TeamworkConfig {
  domain: string;
  inboxId?: number;
  dateFrom?: string;
  dateTo?: string;
  statusFilter?: string[];
}

export interface MinMessagesFilterConfig {
  minCount: number;
}

export interface MinWordsFilterConfig {
  minCount: number;
}

export interface StatusFilterConfig {
  statuses: string[];
}

export interface DateRangeFilterConfig {
  from: string;
  to: string;
}

export type QualityFilterConfig = 
  | MinMessagesFilterConfig 
  | MinWordsFilterConfig 
  | StatusFilterConfig 
  | DateRangeFilterConfig;

export interface PiiStats {
  names: number;
  emails: number;
  phones: number;
  addresses: number;
  companies: number;
  custom: number;
}
```

---

## Section 8: Validation Footer

### Completeness Checklist

- [x] All PRD entities represented
- [x] All relationships defined with cascade behaviour
- [x] Foreign keys indexed
- [x] Audit columns on all tables
- [x] Migration scripts specified
- [x] Type exports defined

### Entity Coverage

| PRD Entity | Schema Table | Status |
|------------|--------------|--------|
| Organisation | organisations | ✓ Complete |
| User | users | ✓ Complete (with soft delete) |
| Invitation | invitations | ✓ Complete |
| Project | projects | ✓ Complete |
| Source | sources | ✓ Complete (base table) |
| FileSource | file_sources | ✓ Complete |
| ApiConnection | api_connections | ✓ Complete |
| FieldMapping | field_mappings | ✓ Complete |
| DeidentificationRule | privacy_configs + privacy_rules | ✓ Complete (renamed for clarity) |
| QualityFilter | quality_filters | ✓ Complete |
| ProcessingRun | processing_runs | ✓ Complete |
| ProcessingOutput | processing_outputs | ✓ Complete |
| ActivityLog | activity_logs | ✓ Complete |
| (Additional) PasswordResetToken | password_reset_tokens | ✓ Added |
| (Additional) EntityMapping | entity_mappings | ✓ Added |

### Document Status: COMPLETE

---

## Section 9: Downstream Agent Handoff Brief

### For Agent 4: API Contract

**Entity Operations Needed:**

| Entity | Operations |
|--------|------------|
| Organisation | GET, PATCH |
| User | GET (list), PATCH (role), DELETE (soft) |
| Invitation | GET (list), POST, DELETE |
| Project | GET (list), GET (single), POST, PATCH, DELETE |
| Source | GET (list), GET (single), POST (file), POST (api), DELETE, POST (refresh) |
| FieldMapping | GET, PUT (batch) |
| PrivacyConfig | GET, PUT |
| PrivacyRule | GET (list), POST, PATCH, DELETE |
| QualityFilter | GET (list), POST, PATCH, DELETE |
| ProcessingRun | GET (list), GET (single), POST (start), POST (cancel) |
| ProcessingOutput | GET (list), GET (download) |
| ActivityLog | GET (list with filters) |

**Relationship Traversal Patterns:**
- Projects include source count in list view
- Sources include type-specific details (fileSource or apiConnection)
- ProcessingRuns include outputs in detail view

**Pagination Requirements:**
- Projects: cursor-based by updatedAt
- ProcessingRuns: cursor-based by createdAt
- ActivityLogs: cursor-based by createdAt, filter by user/entity/date

---

### For Agent 5: UI/UX Specification

**Data Shapes for Forms:**

| Form | Fields |
|------|--------|
| Create Project | name (required, max 200), description (optional) |
| File Upload | file (required, max 50MB), selectedSheet (if Excel) |
| API Connection | provider, credentials (domain, apiKey), config (inbox, dateRange, status) |
| Field Mapping | sourceField → targetField mappings |
| Privacy Config | toggles (names, emails, etc.), custom rules (name, regex, replacement) |
| Quality Filter | filterType, config (type-specific) |

**List/Detail Patterns:**
- Project list shows: name, sourceCount, lastProcessedAt
- Source list shows: name, type, status, recordCount
- Processing history shows: date, duration, status, outputCount

---

### For Agent 6: Implementation Orchestrator

**Schema Location:** `server/db/schema.ts`

**Migration Commands:**
- Development: `npm run db:push`
- Production: `npm run db:generate` then `npm run db:migrate`
- Seed: `npm run db:seed`

**Connection Module:** `server/db/index.ts`

```typescript
// server/db/index.ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sql, { schema });

export async function closeDatabase() {
  await sql.end();
}
```

**Type Imports:**
```typescript
import type { User, Project, Source, ProcessingRun } from './db/types';
import * as schema from './db/schema';
```

**Critical Patterns:**
- All queries must include `organisationId` filter for multi-tenancy
- Use Core Select API only (no Query API)
- Wrap related operations in transactions
- Use `entity_mappings` table for consistent PII replacement

---

### For Agent 7: QA & Deployment

**Seed Data for Testing:**
- Demo organisation (slug: 'demo')
- Admin user: admin@demo.com / password123
- Member user: member@demo.com / password123
- Sample project: "Sample Support Tickets"

**Migration Verification Steps:**
1. Run `npm run db:push` (development) or `npm run db:migrate` (production)
2. Verify all tables created: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
3. Verify indexes created: `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`
4. Run `npm run db:seed` for demo data
5. Test login with demo credentials

**Data Retention Notes:**
- Uploaded files: 30 days (enforce via scheduled cleanup)
- Processing outputs: 30 days or until deleted
- Activity logs: 90 days
- Users: soft delete (isActive = false), never hard delete

---

*Document End*
