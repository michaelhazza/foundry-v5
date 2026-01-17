// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member';
  isActive: boolean;
  organisationId: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Organisation {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: number;
  email: string;
  role: 'admin' | 'member';
  expiresAt: string;
  invitedBy: {
    id: number;
    name: string;
  };
  createdAt: string;
}

// Project types
export interface Project {
  id: number;
  name: string;
  description: string | null;
  organisationId: number;
  createdById: number;
  createdBy?: User;
  sourceCount?: number;
  lastProcessedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Source types
export type SourceType = 'file' | 'api';
export type SourceStatus = 'pending' | 'ready' | 'error' | 'processing';

export interface Source {
  id: number;
  projectId: number;
  type: SourceType;
  name: string;
  status: SourceStatus;
  recordCount: number | null;
  detectedFields: string[] | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileSource extends Source {
  type: 'file';
  mimeType: string;
  size: number;
  originalFilename: string;
  sheetName: string | null;
}

export interface ApiSource extends Source {
  type: 'api';
  provider: string;
  config: {
    inboxId?: number;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  };
  lastSyncAt: string | null;
}

// Mapping types
export interface FieldMapping {
  id: number;
  projectId: number;
  sourceField: string;
  targetField: string;
  isAutoDetected: boolean;
  confidence: number | null;
}

// Privacy types
export interface PrivacyConfig {
  id: number;
  projectId: number;
  detectNames: boolean;
  detectEmails: boolean;
  detectPhones: boolean;
  detectAddresses: boolean;
  detectCompanies: boolean;
  detectCreditCards: boolean;
  detectSsn: boolean;
}

export interface PrivacyRule {
  id: number;
  projectId: number;
  name: string;
  pattern: string;
  replacement: string;
  isEnabled: boolean;
}

// Filter types
export type FilterType = 'min_messages' | 'min_words' | 'status' | 'date_range' | 'custom';

export interface QualityFilter {
  id: number;
  projectId: number;
  filterType: FilterType;
  config: Record<string, unknown>;
  isEnabled: boolean;
}

// Processing types
export type RunStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ProcessingRun {
  id: number;
  projectId: number;
  status: RunStatus;
  progress: number;
  totalRecords: number | null;
  recordsProcessed: number;
  recordsFiltered: number;
  piiStats: {
    names?: number;
    emails?: number;
    phones?: number;
    addresses?: number;
    companies?: number;
    creditCards?: number;
    ssn?: number;
    customRules?: number;
  } | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export type ExportFormat = 'jsonl' | 'qa_pairs' | 'raw_json';

export interface ProcessingOutput {
  id: number;
  runId: number;
  format: ExportFormat;
  filename: string;
  size: number;
  recordCount: number;
  createdAt: string;
}

// Activity types
export interface ActivityLog {
  id: number;
  userId: number | null;
  user?: User | null;
  action: string;
  entityType: string | null;
  entityId: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
}
