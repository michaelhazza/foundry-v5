# Technical Architecture Document: Foundry

**Document ID:** 02-ARCH  
**Version:** 1.0  
**Created:** 2026-01-11  
**Status:** COMPLETE  
**Source PRD:** 01-PRD v1.0

---

## Section 1: Architectural Overview

### High-Level Architecture

Foundry is a multi-tenant SaaS platform deployed as a monolithic full-stack application on Replit. The architecture follows a classic three-tier pattern optimized for single-container deployment:

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                              │
│  React SPA + Vite + shadcn/ui + Tailwind CSS                    │
│  (Static assets served by Express in production)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (Replit proxy)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER TIER                              │
│  Express.js + TypeScript                                         │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │   Auth      │   API       │  Processing │   File Upload   │  │
│  │  Middleware │  Routes     │   Engine    │   Handler       │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Service Layer                             ││
│  │  UserService │ ProjectService │ ProcessingService │ ...     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ postgres-js (pooled)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA TIER                                │
│  PostgreSQL (Neon) via Drizzle ORM                              │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │  Tenant     │  Project    │  Processing │   File Blob     │  │
│  │  Tables     │  Tables     │  Tables     │   Storage       │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Core Architectural Pattern

**Pattern:** Modular Monolith with Service Layer

**Rationale:** Given Replit's single-container deployment model and the requirement for sub-5-minute first-run experience, a modular monolith provides:
- Simple deployment and cold start handling
- In-process communication (no network latency between services)
- Shared database connection pool
- Clear module boundaries for future extraction if needed

### System Boundaries

| Boundary | Internal/External | Communication |
|----------|-------------------|---------------|
| React SPA | Internal | HTTP/JSON via fetch |
| Express API | Internal | In-process service calls |
| PostgreSQL (Neon) | External (Managed) | postgres-js with pooling |
| Teamwork Desk API | External (Third-party) | REST/HTTPS |
| Email Service (Resend) | External (Optional) | REST/HTTPS |

### Key Architectural Drivers

1. **Multi-tenancy:** Organization-scoped data isolation via query-level filtering
2. **Privacy-first:** De-identification as core pipeline stage, not afterthought
3. **Immediate value:** Optimized for 5-minute CSV-to-export flow
4. **Replit-native:** All design decisions validated against Replit constraints
5. **Graceful degradation:** Optional services (email) don't break core flows

---

## Section 2: Technology Stack

### Frontend Stack

| Component | Technology | Rationale | Alternatives Considered |
|-----------|------------|-----------|-------------------------|
| Framework | React 18 | Industry standard, excellent ecosystem, Replit templates available | Vue.js (smaller ecosystem), Svelte (less mature) |
| Build Tool | Vite | Fast HMR, native ESM, excellent DX | CRA (slower, deprecated), Webpack (complex config) |
| Routing | React Router v6 | Standard choice, good TypeScript support | TanStack Router (newer, less adoption) |
| State Management | React Query + Context | Server state caching, minimal boilerplate | Redux (overkill for this scale), Zustand (less server-state focus) |
| UI Components | shadcn/ui | Accessible, customizable, Tailwind-native | Chakra UI (heavier), Radix (lower-level) |
| Styling | Tailwind CSS v4 | Utility-first, excellent DX, consistent with shadcn | CSS Modules (less composable), styled-components (runtime cost) |
| Forms | React Hook Form + Zod | Excellent validation, minimal re-renders | Formik (heavier), native (manual validation) |
| HTTP Client | fetch + custom wrapper | Native, no dependencies, adequate for scope | Axios (unnecessary for this scope) |

### Backend Stack

| Component | Technology | Rationale | Alternatives Considered |
|-----------|------------|-----------|-------------------------|
| Runtime | Node.js 20 LTS | Replit default, excellent ecosystem | Bun (less mature on Replit), Deno (compatibility issues) |
| Framework | Express.js 4.x | Simple, proven, extensive middleware | Fastify (marginal gains), Hono (less ecosystem) |
| Language | TypeScript 5.x | Type safety, better DX, IDE support | JavaScript (no type safety) |
| ORM | Drizzle ORM | Type-safe, lightweight, excellent DX | Prisma (heavier, migration complexity), TypeORM (verbose) |
| Validation | Zod | Runtime validation, TypeScript inference | Yup (less TypeScript-native), Joi (verbose) |
| Auth | jsonwebtoken + bcrypt | Standard JWT flow, proven security | Passport.js (overkill), Auth0 (external dependency) |
| File Parsing | papaparse (CSV), xlsx (Excel), native JSON | Battle-tested libraries | csv-parse (less features), exceljs (heavier) |

### Infrastructure Stack

| Component | Technology | Rationale | Alternatives Considered |
|-----------|------------|-----------|-------------------------|
| Hosting | Replit | Client requirement | N/A (specified in PRD) |
| Database | PostgreSQL via Neon | Replit-native, serverless scaling | SQLite (no concurrent access), MySQL (less Replit support) |
| DB Driver | postgres-js | Replit-compatible, pooling support | @neondatabase/serverless (FAILS on Replit with "fetch failed") |
| File Storage | PostgreSQL bytea columns | Simplest for ephemeral filesystem constraint | S3 (external dependency), local (ephemeral) |
| Email | Resend (optional) | Simple API, generous free tier | SendGrid (complex), AWS SES (overkill) |

### Development Tools

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Package Manager | npm | Replit default, reliable |
| TypeScript Execution | tsx | Direct TS execution without compilation |
| Migrations | drizzle-kit | Integrated with Drizzle ORM |
| Linting | ESLint + Prettier | Industry standard |
| Testing | Vitest + Testing Library | Fast, Vite-native |

---

## Section 3: PRD-to-Architecture Traceability

| PRD Feature | PRD ID | Architectural Support |
|-------------|--------|----------------------|
| User Authentication | F-001 | JWT middleware, bcrypt hashing, auth routes, localStorage token storage |
| Organization & User Management | F-002 | Multi-tenant data model, organization_id on all tables, role-based middleware |
| Project Management | F-003 | Project CRUD service, org-scoped queries |
| File Upload Source | F-004 | Multer middleware, papaparse/xlsx parsers, bytea storage |
| Teamwork Desk API | F-005 | TeamworkService with retry/rate-limit, encrypted credentials |
| Field Mapping | F-006 | FieldMapping table, auto-detection algorithm, mapping service |
| De-identification | F-007 | DeidentificationEngine module, entity tracking, regex patterns |
| Quality Filtering | F-008 | FilterService with configurable criteria |
| Processing Engine | F-009 | ProcessingService with chunked execution, progress persistence |
| Export | F-010 | ExportService with format transformers (JSONL, Q&A, Raw) |
| Audit & Reporting | F-011 | ActivityLog table, report generation service |

### Unmapped Requirements (None)

All PRD features have clear architectural support. No orphaned requirements.

---

## Section 4: Component Architecture

### Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        React Application                          │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐ │  │
│  │  │  Auth   │ │ Projects│ │ Sources │ │ Config  │ │  Processing │ │  │
│  │  │  Pages  │ │  Pages  │ │  Pages  │ │  Pages  │ │    Pages    │ │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └──────┬──────┘ │  │
│  │       └───────────┴──────────┬┴──────────┴──────────────┘        │  │
│  │                              ▼                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────┐│  │
│  │  │                    Shared Components                          ││  │
│  │  │  Layout │ DataTable │ FileUploader │ ProgressBar │ Forms     ││  │
│  │  └──────────────────────────────────────────────────────────────┘│  │
│  │                              ▼                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────┐│  │
│  │  │                      API Client Layer                         ││  │
│  │  │  authApi │ projectsApi │ sourcesApi │ processingApi │ ...    ││  │
│  │  └──────────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              SERVER                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        Middleware Stack                           │  │
│  │  helmet │ cors │ morgan │ rateLimit │ express.json │ authMiddleware│ │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         Route Layer                               │  │
│  │  /api/auth │ /api/users │ /api/projects │ /api/sources │ ...     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        Service Layer                              │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │  │
│  │  │ AuthService │ │ UserService │ │ProjectService│ │SourceService│ │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │  │
│  │  │  Processing │ │   Export    │ │  Teamwork   │ │  Activity   │ │  │
│  │  │   Service   │ │   Service   │ │   Service   │ │   Service   │ │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Domain Modules                                │  │
│  │  ┌─────────────────────┐ ┌─────────────────────┐                 │  │
│  │  │ DeidentificationEngine│ │    FileParser      │                 │  │
│  │  │  - EntityTracker     │ │  - CSVParser       │                 │  │
│  │  │  - PIIDetector       │ │  - ExcelParser     │                 │  │
│  │  │  - PatternMatcher    │ │  - JSONParser      │                 │  │
│  │  └─────────────────────┘ └─────────────────────┘                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Data Access Layer                              │  │
│  │  Drizzle ORM │ Schema │ Queries │ Connection Pool                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Responsibility Matrix

| Component | Responsibilities |
|-----------|------------------|
| **AuthService** | User authentication, JWT generation/validation, password hashing, invitation handling |
| **UserService** | User CRUD, role management, organization membership |
| **ProjectService** | Project CRUD, organization scoping, project statistics |
| **SourceService** | Source CRUD, file upload handling, source preview |
| **TeamworkService** | API connection, credential encryption, ticket fetching, rate limit handling |
| **MappingService** | Field mapping CRUD, auto-detection, validation |
| **DeidentificationEngine** | PII detection, entity tracking, placeholder generation, pattern matching |
| **FilterService** | Quality filter configuration, record evaluation |
| **ProcessingService** | Pipeline orchestration, progress tracking, chunked execution |
| **ExportService** | Format transformation (JSONL, Q&A, Raw), file generation |
| **ActivityService** | Audit logging, activity queries |

### Key Interfaces

```typescript
// Service Layer Contract Example
interface IProcessingService {
  startProcessing(projectId: number, userId: number): Promise<ProcessingRun>;
  getProgress(runId: number): Promise<ProcessingProgress>;
  cancelProcessing(runId: number): Promise<void>;
  getHistory(projectId: number): Promise<ProcessingRun[]>;
}

interface IDeidentificationEngine {
  configure(rules: DeidentificationConfig): void;
  process(records: Record<string, unknown>[]): Promise<DeidentifiedResult>;
  preview(sample: Record<string, unknown>[]): Promise<PreviewResult>;
  getEntityMap(): Map<string, string>;
}

interface ITeamworkService {
  testConnection(credentials: TeamworkCredentials): Promise<ConnectionResult>;
  fetchTickets(config: FetchConfig): AsyncGenerator<Ticket[]>;
  getInboxes(credentials: TeamworkCredentials): Promise<Inbox[]>;
}
```

---

## Section 5: Authentication and Authorisation

### Authentication Flow

#### Registration (Invitation-Based)

```
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐
│  Admin  │         │  Server │         │  Email  │         │ Invitee │
└────┬────┘         └────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │                   │
     │ POST /api/users/invite               │                   │
     │ { email, role }   │                   │                   │
     │──────────────────▶│                   │                   │
     │                   │                   │                   │
     │                   │ Create invitation │                   │
     │                   │ Generate token    │                   │
     │                   │                   │                   │
     │                   │ Send invite email │                   │
     │                   │──────────────────▶│                   │
     │                   │                   │                   │
     │                   │                   │ Email with link   │
     │                   │                   │──────────────────▶│
     │                   │                   │                   │
     │   201 Created     │                   │                   │
     │◀──────────────────│                   │                   │
     │                   │                   │                   │
     │                   │                   │  Click link       │
     │                   │                   │  /accept-invite   │
     │                   │◀──────────────────────────────────────│
     │                   │                   │                   │
     │                   │ POST /api/auth/register              │
     │                   │ { token, password, name }            │
     │                   │◀──────────────────────────────────────│
     │                   │                   │                   │
     │                   │ Create user       │                   │
     │                   │ Delete invitation │                   │
     │                   │ Generate JWT      │                   │
     │                   │                   │                   │
     │                   │ 201 + JWT token   │                   │
     │                   │──────────────────────────────────────▶│
```

#### Login Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│  User   │         │  Server │         │   DB    │
└────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │
     │ POST /api/auth/login                 │
     │ { email, password }                  │
     │──────────────────▶│                   │
     │                   │                   │
     │                   │ Find user by email│
     │                   │──────────────────▶│
     │                   │◀──────────────────│
     │                   │                   │
     │                   │ Verify bcrypt hash│
     │                   │                   │
     │                   │ Generate JWT      │
     │                   │ (7-day expiry)    │
     │                   │                   │
     │   200 + JWT       │                   │
     │◀──────────────────│                   │
     │                   │                   │
     │ Store in localStorage                │
     │                   │                   │
```

### Token Management

**JWT Structure:**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "org": "organization_id",
    "role": "admin|member",
    "iat": 1704931200,
    "exp": 1705536000
  }
}
```

**Token Lifecycle:**
- Expiry: 7 days from issuance
- Storage: localStorage (client-side)
- Refresh: Not implemented for MVP (user re-authenticates after expiry)
- Logout: Delete token from localStorage, no server-side invalidation

**401 Handling (Client):**
```typescript
// client/lib/api.ts
if (response.status === 401) {
  localStorage.removeItem('token');
  const authPaths = ['/login', '/register', '/forgot-password', '/accept-invite'];
  if (!authPaths.includes(window.location.pathname)) {
    window.location.href = '/login';
  }
}
```

### Password Reset Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│  User   │         │  Server │         │  Email  │
└────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │
     │ POST /api/auth/forgot-password       │
     │ { email }         │                   │
     │──────────────────▶│                   │
     │                   │                   │
     │                   │ Generate reset token
     │                   │ (1-hour expiry)   │
     │                   │                   │
     │                   │ Send reset email  │
     │                   │──────────────────▶│
     │                   │                   │
     │   200 OK          │                   │
     │◀──────────────────│                   │
     │                   │                   │
     │ (User clicks link)│                   │
     │                   │                   │
     │ POST /api/auth/reset-password        │
     │ { token, newPassword }               │
     │──────────────────▶│                   │
     │                   │                   │
     │                   │ Validate token    │
     │                   │ Hash new password │
     │                   │ Update user       │
     │                   │ Invalidate token  │
     │                   │                   │
     │   200 OK          │                   │
     │◀──────────────────│                   │
```

**Email Service Unavailable Fallback:**
When Resend API key is not configured:
- Invitation emails: Admin manually shares invitation link (displayed in UI)
- Password reset: Admin-initiated password reset (admin sets temporary password)

### Role-Based Access Control (RBAC)

**Roles:**
| Role | Permissions |
|------|-------------|
| Admin | Full organization access, user management, project deletion |
| Member | Project access (CRUD except delete), source management, processing |

**Route Protection Matrix:**

| Route Pattern | Admin | Member | Notes |
|---------------|-------|--------|-------|
| GET /api/auth/me | ✓ | ✓ | Own profile |
| POST /api/users/invite | ✓ | ✗ | Admin only |
| DELETE /api/users/:id | ✓ | ✗ | Admin only |
| PATCH /api/users/:id/role | ✓ | ✗ | Admin only |
| GET /api/projects | ✓ | ✓ | Org-scoped |
| POST /api/projects | ✓ | ✓ | |
| DELETE /api/projects/:id | ✓ | ✗ | Admin only |
| * /api/sources/* | ✓ | ✓ | Project-scoped |
| * /api/processing/* | ✓ | ✓ | Project-scoped |
| GET /api/activity | ✓ (all) | ✓ (own) | Filtered by role |

**Middleware Implementation:**
```typescript
// server/middleware/auth.ts
export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
  }
  next();
};
```

---

## Section 6: Security Architecture (MVP)

### Security Middleware Configuration

```typescript
// server/middleware/security.ts
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

export function setupSecurityMiddleware(app: Express) {
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Relaxed for MVP, configure properly post-MVP
  }));

  // CORS
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.APP_URL 
      : true,
    credentials: true,
  }));

  // Request logging
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Global rate limiter
  app.use(globalLimiter);
}
```

### Rate Limiting Strategy

```typescript
// server/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

// Global limiter: 100 requests per 15 minutes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth endpoints: 10 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Processing limiter: 5 concurrent processing requests per org
export const processingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.org?.toString() || req.ip,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many processing requests' } },
});
```

### Input Validation Approach

All user inputs validated with Zod schemas before processing:

```typescript
// server/schemas/auth.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password required'),
});

export const registerSchema = z.object({
  token: z.string().min(1, 'Invitation token required'),
  name: z.string().min(1, 'Name required').max(100),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
});

// Validation middleware
export function validate(schema: z.ZodSchema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
        });
      }
      next(error);
    }
  };
}
```

### Error Handling Pattern

```typescript
// server/errors/index.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super('BAD_REQUEST', message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: number | string) {
    super('NOT_FOUND', id ? `${resource} ${id} not found` : `${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

// Global error handler
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message }
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  });
}
```

### Credential Encryption

API credentials (Teamwork API keys) encrypted at rest using AES-256-GCM:

```typescript
// server/lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encrypt(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(ciphertext: string, key: Buffer): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Security Requirements Summary

| Area | Implementation |
|------|----------------|
| Security Headers | Helmet middleware (CSP relaxed for MVP) |
| CORS | Origin-restricted in production |
| Rate Limiting | Global (100/15min) + Auth (10/15min) + Processing (5/min/org) |
| Password Hashing | bcrypt with cost factor 12 |
| Input Validation | Zod schemas on all endpoints |
| Token Expiry | JWT 7-day expiration |
| Credential Storage | AES-256-GCM encryption at rest |
| Multi-tenancy | Organization ID on all queries, middleware validation |

---

## Section 7: Data Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA INGESTION                                   │
│                                                                          │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────────────────┐  │
│  │ File Upload │      │ Teamwork    │      │     Source Storage      │  │
│  │ CSV/Excel/  │─────▶│ API Fetch   │─────▶│  (PostgreSQL bytea +   │  │
│  │   JSON      │      │             │      │   metadata tables)      │  │
│  └─────────────┘      └─────────────┘      └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PROCESSING PIPELINE                              │
│                                                                          │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────────────────┐  │
│  │   Field     │      │   Quality   │      │    De-identification    │  │
│  │   Mapping   │─────▶│   Filtering │─────▶│    (PII Detection +     │  │
│  │             │      │             │      │     Replacement)        │  │
│  └─────────────┘      └─────────────┘      └─────────────────────────┘  │
│                                                        │                 │
│                                                        ▼                 │
│                                            ┌─────────────────────────┐  │
│                                            │   Format Transformation │  │
│                                            │   (JSONL, Q&A, Raw)     │  │
│                                            └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         OUTPUT STORAGE                                   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    ProcessingOutput Table                            ││
│  │  - output_data (bytea) - generated file content                     ││
│  │  - format (enum) - JSONL, QA, RAW                                   ││
│  │  - record_count, file_size, created_at                              ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### Storage Strategy

| Data Type | Storage Location | Retention | Rationale |
|-----------|------------------|-----------|-----------|
| User/Org data | PostgreSQL tables | Indefinite | Core application state |
| Project config | PostgreSQL tables | Until deleted | User-managed lifecycle |
| Uploaded files | PostgreSQL bytea | 30 days | Ephemeral FS constraint |
| API credentials | PostgreSQL (encrypted) | Until deleted | Must persist |
| Processing outputs | PostgreSQL bytea | 30 days or until deleted | Balance storage vs convenience |
| Activity logs | PostgreSQL tables | 90 days | Compliance requirement |
| Entity maps | PostgreSQL jsonb | Per processing run | De-identification consistency |

### File Storage Design

Given Replit's ephemeral filesystem, all files stored as PostgreSQL bytea columns:

```typescript
// Simplified schema excerpt
export const fileSources = pgTable('file_sources', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').references(() => sources.id),
  originalName: varchar('original_name', { length: 255 }),
  mimeType: varchar('mime_type', { length: 100 }),
  fileSize: integer('file_size'),
  fileData: bytea('file_data'), // Raw file bytes
  parsedData: jsonb('parsed_data'), // Parsed structure (rows, columns)
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Size Constraints:**
- Max file size: 50MB (enforced at upload)
- PostgreSQL bytea can handle this efficiently
- For larger scale (post-MVP), consider external storage (S3)

### Caching Strategy

**MVP Approach:** Minimal caching, database as source of truth

| Data | Cache? | Notes |
|------|--------|-------|
| User sessions | No | JWT is stateless |
| Project data | React Query | Client-side with stale-while-revalidate |
| File previews | In-memory (server) | Short-lived during preview request |
| Processing progress | Database | Must survive cold starts |
| Entity maps | Database (jsonb) | Must persist across chunks |

**Post-MVP Consideration:** Add Redis for session caching and real-time progress if needed.

---

## Section 8: Third-Party Integrations

### Integration 1: Teamwork Desk API

| Attribute | Value |
|-----------|-------|
| **Classification** | Required (MVP) |
| **API Type** | REST |
| **Base URL** | `https://{domain}.teamwork.com/desk/v1` |
| **Authentication** | API Key (Basic Auth header) |
| **Rate Limits** | 150 requests/minute (per API key) |
| **Cost** | Included in Teamwork subscription |

**Endpoints Used:**
- `GET /inboxes` - List available inboxes
- `GET /tickets` - List tickets with pagination and filters
- `GET /tickets/{id}/threads` - Get conversation threads

**Failure Modes:**
| Failure | Detection | Fallback |
|---------|-----------|----------|
| Invalid credentials | 401 response | Show error, prompt re-entry |
| Rate limited | 429 response | Exponential backoff, resume |
| Network timeout | Request timeout | Retry with backoff (3 attempts) |
| API unavailable | 5xx responses | Show error, allow retry later |

**Implementation:**
```typescript
// server/services/teamwork.ts
export class TeamworkService {
  private async request<T>(endpoint: string, credentials: DecryptedCredentials): Promise<T> {
    const response = await fetch(`https://${credentials.domain}.teamwork.com/desk/v1${endpoint}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(credentials.apiKey + ':x').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      throw new RateLimitError(retryAfter);
    }

    if (!response.ok) {
      throw new TeamworkError(response.status, await response.text());
    }

    return response.json();
  }

  async *fetchTickets(config: FetchConfig): AsyncGenerator<Ticket[]> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.request<TicketListResponse>(
        `/tickets?page=${page}&status=${config.status}&inboxId=${config.inboxId}`,
        config.credentials
      );

      yield response.tickets;

      hasMore = response.tickets.length === response.pageSize;
      page++;

      // Respect rate limits
      await this.delay(400); // ~150 req/min = 2.5 req/sec
    }
  }
}
```

### Integration 2: Resend (Email Service)

| Attribute | Value |
|-----------|-------|
| **Classification** | Optional (graceful degradation) |
| **API Type** | REST |
| **Base URL** | `https://api.resend.com` |
| **Authentication** | API Key (Bearer token) |
| **Rate Limits** | 10 emails/second (free tier) |
| **Cost** | Free tier: 100 emails/day |

**Endpoints Used:**
- `POST /emails` - Send transactional email

**Failure Modes:**
| Failure | Detection | Fallback |
|---------|-----------|----------|
| API key missing | Config check | Display invite link in UI, manual password reset |
| Rate limited | 429 response | Queue for retry |
| Delivery failed | Webhook/API error | Log error, admin notification |

**Implementation:**
```typescript
// server/services/email.ts
export class EmailService {
  private enabled: boolean;

  constructor() {
    this.enabled = !!process.env.RESEND_API_KEY;
  }

  async sendInvitation(email: string, inviteUrl: string): Promise<{ sent: boolean; fallbackUrl?: string }> {
    if (!this.enabled) {
      return { sent: false, fallbackUrl: inviteUrl };
    }

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Foundry <noreply@foundry.app>',
          to: email,
          subject: 'You\'ve been invited to Foundry',
          html: this.renderInviteTemplate(inviteUrl),
        }),
      });
      return { sent: true };
    } catch (error) {
      console.error('Email send failed:', error);
      return { sent: false, fallbackUrl: inviteUrl };
    }
  }
}
```

---

## Section 9: Replit Deployment Configuration

### .replit File

```toml
run = "npm run start"
entrypoint = "server/index.ts"

[nix]
channel = "stable-24_05"

[deployment]
run = ["sh", "-c", "npm run start"]
deploymentTarget = "cloudrun"

[[ports]]
localPort = 5000
externalPort = 80
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "tsx watch server/index.ts",
    "dev:client": "vite",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc -p tsconfig.server.json",
    "start": "NODE_ENV=production tsx server/index.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx server/db/migrate.ts",
    "db:push": "drizzle-kit push"
  }
}
```

### Environment Variables

| Variable | Classification | Default | Description |
|----------|----------------|---------|-------------|
| `DATABASE_URL` | Critical | None | Neon PostgreSQL connection string |
| `JWT_SECRET` | Required with Fallback | Random in dev | JWT signing secret (32+ chars) |
| `SESSION_SECRET` | Required with Fallback | Random in dev | Session encryption (32+ chars) |
| `ENCRYPTION_KEY` | Required with Fallback | Random in dev | API credential encryption (32 bytes hex) |
| `PORT` | Runtime | 5000 (prod), 3001 (dev) | Server port |
| `NODE_ENV` | Runtime | development | Environment mode |
| `APP_URL` | Runtime | Auto-detected | Application URL for CORS/emails |
| `RESEND_API_KEY` | Optional | None | Email service (features degrade gracefully) |

### Environment Validation

```typescript
// server/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32).default(() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET required in production');
    }
    return crypto.randomBytes(32).toString('hex');
  }),
  SESSION_SECRET: z.string().min(32).default(() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET required in production');
    }
    return crypto.randomBytes(32).toString('hex');
  }),
  ENCRYPTION_KEY: z.string().length(64).default(() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY required in production');
    }
    return crypto.randomBytes(32).toString('hex');
  }),
  PORT: z.coerce.number().default(() => 
    process.env.NODE_ENV === 'production' ? 5000 : 3001
  ),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

### Port Configuration

```typescript
// server/index.ts
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 5000 : 3001);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Section 10: Architecture Decision Records

### ADR-001: Database-Based File Storage

**Context:** Replit has an ephemeral filesystem that resets on redeploy. User-uploaded files (up to 50MB) must persist.

**Decision:** Store uploaded files as PostgreSQL bytea columns rather than external storage (S3) or filesystem.

**Alternatives Considered:**
1. **S3/GCS:** External dependency, credentials management, egress costs
2. **Filesystem:** Would lose files on redeploy
3. **PostgreSQL bytea:** Simple, no external dependencies, adequate for MVP scale

**Consequences:**
- (+) Single deployment unit, no external storage configuration
- (+) Automatic backup with database
- (+) Simplified development workflow
- (-) Database size grows with file uploads
- (-) Potential performance impact for very large files
- (-) May need migration to external storage post-MVP for scale

**Status:** Accepted

---

### ADR-002: Synchronous Processing with Chunked Progress

**Context:** Replit doesn't support dedicated background workers. Processing 100K records could exceed request timeouts.

**Decision:** Implement processing as a synchronous operation with:
- Chunked execution (1000 records per chunk)
- Progress persisted to database after each chunk
- Client polls for progress updates
- Resume capability from last successful chunk

**Alternatives Considered:**
1. **Background workers (BullMQ):** Requires Redis, complex setup on Replit
2. **Serverless functions:** Not available on Replit
3. **WebSocket streaming:** Complex, doesn't survive cold starts
4. **Chunked sync + polling:** Simple, resilient, works within constraints

**Consequences:**
- (+) Simple implementation, no queue infrastructure
- (+) Progress survives cold starts (DB-persisted)
- (+) Clear recovery path on failures
- (-) Browser must stay open or user must return to check status
- (-) Not optimal for very long-running jobs (>10 min)

**Status:** Accepted

---

### ADR-003: Custom De-identification Engine

**Context:** PII detection and consistent replacement is a core feature. Need to detect names, emails, phones, addresses, and custom patterns.

**Decision:** Build custom de-identification engine using:
- Regex patterns for structured PII (email, phone)
- NLP library (compromise.js) for name detection
- Entity tracking map (jsonb) for consistent replacement
- Custom pattern support (user-defined regex)

**Alternatives Considered:**
1. **Microsoft Presidio:** Heavy dependency, complex deployment
2. **AWS Comprehend:** External API dependency, cost
3. **SpaCy:** Python, would require separate service
4. **Custom engine:** JavaScript-native, no external dependencies

**Consequences:**
- (+) No external dependencies
- (+) Full control over detection logic
- (+) Can optimize for performance
- (-) May have lower accuracy than ML-based solutions
- (-) Requires ongoing maintenance for edge cases
- (-) English-focused initially

**Status:** Accepted

---

### ADR-004: JWT Authentication without Refresh Tokens

**Context:** Need secure authentication for 7-day sessions. Refresh tokens add complexity.

**Decision:** Use JWT tokens with 7-day expiry, stored in localStorage. No refresh token mechanism for MVP.

**Alternatives Considered:**
1. **JWT + Refresh tokens:** More secure, complex implementation
2. **Session cookies:** Server-side state, doesn't work well with cold starts
3. **Simple JWT:** Adequate security for MVP, simple implementation

**Consequences:**
- (+) Stateless authentication, survives cold starts
- (+) Simple implementation
- (+) Works well with React SPA
- (-) Token cannot be invalidated before expiry
- (-) 7-day window if token compromised
- (-) User must re-login after 7 days

**Status:** Accepted

---

### ADR-005: postgres-js over @neondatabase/serverless

**Context:** Need PostgreSQL driver for Neon database. Two main options available.

**Decision:** Use postgres-js package with drizzle-orm/postgres-js adapter.

**Alternatives Considered:**
1. **@neondatabase/serverless:** Neon's official driver, but causes "fetch failed" errors in Replit environment
2. **postgres-js:** Battle-tested, works reliably in Replit, excellent pooling support

**Consequences:**
- (+) Reliable operation in Replit environment
- (+) Excellent connection pooling
- (+) Active maintenance
- (-) Not Neon's official recommendation (but compatible)

**Status:** Accepted

---

### ADR-006: Multi-tenant Query Scoping via Middleware

**Context:** All data must be scoped to organizations. Cross-tenant data access must be impossible.

**Decision:** Implement multi-tenancy via:
- `organization_id` column on all tenant-scoped tables
- Middleware extracts org from JWT and attaches to request
- All queries explicitly filter by organization_id
- Foreign key constraints prevent orphaned records

**Alternatives Considered:**
1. **Separate databases per tenant:** Complex, expensive, overkill for MVP
2. **Row-level security (RLS):** PostgreSQL feature, adds complexity
3. **Query-level filtering:** Simple, explicit, easy to audit

**Consequences:**
- (+) Simple to understand and audit
- (+) No database-level complexity
- (+) Easy to test
- (-) Requires discipline in every query
- (-) Potential for bugs if filter forgotten

**Mitigation:** Service layer enforces org scoping; all queries go through services.

**Status:** Accepted

---

### ADR-007: Drizzle ORM Core Select API Only

**Context:** Drizzle ORM offers two APIs: Core Select API and Query API.

**Decision:** Use only Core Select API throughout the codebase.

```typescript
// ✓ REQUIRED - Core Select API
const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

// ✗ FORBIDDEN - Query API
const user = await db.query.users.findFirst({ where: eq(users.id, id) });
```

**Rationale:**
- Core Select API has more consistent TypeScript inference
- Easier to compose complex queries
- Better alignment with SQL mental model
- Consistent codebase style

**Status:** Accepted

---

## Section 11: Validation Footer

## Document Validation

### Completeness Checklist
- [x] All PRD features have architectural support
- [x] Technology stack complete with rationale
- [x] Auth flows fully specified
- [x] Integrations classified (required/optional)
- [x] Replit configuration complete
- [x] Security middleware specified
- [x] Minimum 5 ADRs documented (7 total)

### Confidence Scores
| Section | Score (1-10) | Notes |
|---------|--------------|-------|
| Architectural Overview | 9 | Clear pattern, well-justified |
| Technology Stack | 9 | All decisions have rationale and alternatives |
| PRD Traceability | 10 | Complete mapping, no orphans |
| Component Architecture | 8 | Clear responsibilities, may evolve during implementation |
| Authentication | 9 | Complete flows, edge cases covered |
| Security Architecture | 8 | MVP-appropriate, post-MVP hardening identified |
| Data Architecture | 8 | File storage in DB is pragmatic but has scale limits |
| Integrations | 9 | Complete specs for both integrations |
| Replit Configuration | 10 | Validated against Replit requirements |
| ADRs | 9 | Key decisions documented with trade-offs |

### Document Status: COMPLETE

---

## Section 12: Downstream Agent Handoff Brief

### For Agent 3: Data Modeling
- Database: PostgreSQL via Neon
- ORM: Drizzle ORM (Core Select API only)
- Driver: postgres-js (NOT @neondatabase/serverless)
- Connection: Pool with caching enabled (max: 10, idle_timeout: 20)
- Multi-tenancy: organization_id on all tenant-scoped tables
- File storage: bytea columns for uploaded files and outputs
- Key entities: Organization, User, Invitation, Project, Source, FileSource, ApiConnection, FieldMapping, DeidentificationRule, QualityFilter, ProcessingRun, ProcessingOutput, ActivityLog

### For Agent 4: API Contract
- Framework: Express.js
- Base path: /api
- Auth: JWT Bearer tokens in Authorization header
- Error format: `{ "error": { "code": "<ERROR_CODE>", "message": "<human readable>" } }`
- Health endpoint: GET /api/health → `{ "status": "ok", "timestamp": "<ISO8601>" }`
- Rate limiting: Global (100/15min), Auth (10/15min), Processing (5/min/org)

### For Agent 5: UI/UX Specification
- Framework: React 18 + Vite
- Components: shadcn/ui
- Styling: Tailwind CSS v4 with CSS variables
- State: React Query for server state, Context for UI state
- Forms: React Hook Form + Zod
- Auth storage: localStorage for JWT token
- 401 handling: Clear token, redirect to /login (unless already on auth page)

### For Agent 6: Implementation Orchestrator
- Security middleware required: helmet, cors, express-rate-limit, morgan
- Graceful shutdown handler required
- parseIntParam validation utility required for all URL params
- Route registration order: specific before parameterized
- Error class hierarchy: AppError → BadRequestError, NotFoundError, etc.
- File parsing libraries: papaparse (CSV), xlsx (Excel)
- De-identification: Custom engine with compromise.js for NER
- Processing: Chunked execution (1000 records), progress in DB

### For Agent 7: QA & Deployment
- Health endpoint: GET /api/health → `{ "status": "ok", "timestamp": "<ISO8601>" }`
- Environment variables: DATABASE_URL (critical), JWT_SECRET (required), RESEND_API_KEY (optional)
- Port: 5000 in production
- Deployment verification: Health check, database connectivity, static asset serving
- Critical test scenarios from PRD: 5-min first-run, 100K records, de-identification consistency

---

*Document End*
