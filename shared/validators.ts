import { z } from 'zod';

// Auth validators
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
});

// User validators
export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

// Project validators
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters').optional(),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional().nullable(),
});

// Source validators
export const createApiSourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  provider: z.literal('teamwork'),
  domain: z.string().min(1, 'Domain is required'),
  apiKey: z.string().min(1, 'API key is required'),
  config: z.object({
    inboxId: z.number().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    status: z.string().optional(),
  }).optional(),
});

// Mapping validators
export const updateMappingSchema = z.object({
  mappings: z.array(
    z.object({
      sourceField: z.string().min(1),
      targetField: z.string().min(1),
    })
  ),
});

// Privacy validators
export const updatePrivacyConfigSchema = z.object({
  detectNames: z.boolean().optional(),
  detectEmails: z.boolean().optional(),
  detectPhones: z.boolean().optional(),
  detectAddresses: z.boolean().optional(),
  detectCompanies: z.boolean().optional(),
  detectCreditCards: z.boolean().optional(),
  detectSsn: z.boolean().optional(),
});

export const createPrivacyRuleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  pattern: z.string().min(1, 'Pattern is required'),
  replacement: z.string().min(1, 'Replacement is required').max(200),
});

export const updatePrivacyRuleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  pattern: z.string().min(1).optional(),
  replacement: z.string().min(1).max(200).optional(),
  isEnabled: z.boolean().optional(),
});

// Filter validators
export const createFilterSchema = z.object({
  filterType: z.enum(['min_messages', 'min_words', 'status', 'date_range', 'custom']),
  config: z.record(z.unknown()),
});

export const updateFilterSchema = z.object({
  config: z.record(z.unknown()).optional(),
  isEnabled: z.boolean().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateApiSourceInput = z.infer<typeof createApiSourceSchema>;
export type UpdateMappingInput = z.infer<typeof updateMappingSchema>;
export type UpdatePrivacyConfigInput = z.infer<typeof updatePrivacyConfigSchema>;
export type CreatePrivacyRuleInput = z.infer<typeof createPrivacyRuleSchema>;
export type UpdatePrivacyRuleInput = z.infer<typeof updatePrivacyRuleSchema>;
export type CreateFilterInput = z.infer<typeof createFilterSchema>;
export type UpdateFilterInput = z.infer<typeof updateFilterSchema>;
