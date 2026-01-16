// Shared types between client and server

// User roles
export type UserRole = 'admin' | 'member';

// Source types
export type SourceType = 'file' | 'api';
export type SourceStatus = 'pending' | 'ready' | 'error' | 'processing';

// Processing types
export type RunStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type ExportFormat = 'jsonl' | 'qa_pairs' | 'raw_json';

// Filter types
export type FilterType = 'min_messages' | 'min_words' | 'status' | 'date_range' | 'custom';

// Target fields for mapping
export const TARGET_FIELDS = [
  'ticket_id',
  'conversation_id',
  'message_content',
  'sender_role',
  'sender_name',
  'sender_email',
  'timestamp',
  'subject',
  'status',
  'priority',
  'tags',
  'custom_field',
  'ignore',
] as const;

export type TargetField = typeof TARGET_FIELDS[number];

// PII Types
export const PII_TYPES = [
  'names',
  'emails',
  'phones',
  'addresses',
  'companies',
  'creditCards',
  'ssn',
] as const;

export type PiiType = typeof PII_TYPES[number];

// Activity actions
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

export type ActivityAction = typeof ACTIVITY_ACTIONS[keyof typeof ACTIVITY_ACTIONS];
