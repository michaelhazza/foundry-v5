import { db } from '../db';
import { fieldMappings, projects, sources } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError } from '../errors';

const TARGET_FIELD_PATTERNS: Record<string, string[]> = {
  ticket_id: ['ticket_id', 'id', 'case_id', 'reference', 'ticket_number', 'case_number'],
  conversation_id: ['conversation_id', 'thread_id', 'chat_id', 'session_id'],
  message_content: ['message', 'content', 'body', 'text', 'description', 'note'],
  sender_role: ['role', 'sender_role', 'type', 'user_type', 'agent_or_customer'],
  sender_name: ['name', 'sender_name', 'from_name', 'author', 'user_name', 'full_name'],
  sender_email: ['email', 'sender_email', 'from_email', 'user_email', 'contact_email'],
  timestamp: ['timestamp', 'created_at', 'date', 'time', 'sent_at', 'datetime'],
  subject: ['subject', 'title', 'topic', 'heading'],
  status: ['status', 'state', 'ticket_status'],
  priority: ['priority', 'urgency', 'importance'],
  tags: ['tags', 'labels', 'categories'],
};

export interface MappingInput {
  sourceField: string;
  targetField: string;
}

export const mappingService = {
  /**
   * Get mappings for a project
   */
  async getProjectMappings(organisationId: number, projectId: number) {
    // Verify project belongs to organisation
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.organisationId, organisationId))
      )
      .limit(1);

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    const mappings = await db
      .select()
      .from(fieldMappings)
      .where(eq(fieldMappings.projectId, projectId));

    return mappings;
  },

  /**
   * Update mappings for a project (batch operation)
   */
  async updateProjectMappings(
    organisationId: number,
    projectId: number,
    mappings: MappingInput[]
  ) {
    // Verify project belongs to organisation
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.organisationId, organisationId))
      )
      .limit(1);

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    // Delete existing mappings
    await db.delete(fieldMappings).where(eq(fieldMappings.projectId, projectId));

    // Insert new mappings
    if (mappings.length > 0) {
      const newMappings = await db
        .insert(fieldMappings)
        .values(
          mappings.map((m) => ({
            projectId,
            sourceField: m.sourceField,
            targetField: m.targetField,
            isAutoDetected: false,
          }))
        )
        .returning();

      return newMappings;
    }

    return [];
  },

  /**
   * Auto-detect field mappings based on source fields
   */
  autoDetectMappings(sourceFields: string[]): Array<{
    sourceField: string;
    targetField: string;
    confidence: number;
  }> {
    const suggestions: Array<{
      sourceField: string;
      targetField: string;
      confidence: number;
    }> = [];

    for (const sourceField of sourceFields) {
      const normalizedSource = sourceField.toLowerCase().replace(/[_-\s]/g, '');

      for (const [targetField, patterns] of Object.entries(TARGET_FIELD_PATTERNS)) {
        for (const pattern of patterns) {
          const normalizedPattern = pattern.replace(/[_-\s]/g, '');

          // Exact match
          if (normalizedSource === normalizedPattern) {
            suggestions.push({
              sourceField,
              targetField,
              confidence: 1.0,
            });
            break;
          }

          // Contains match
          if (
            normalizedSource.includes(normalizedPattern) ||
            normalizedPattern.includes(normalizedSource)
          ) {
            suggestions.push({
              sourceField,
              targetField,
              confidence: 0.7,
            });
            break;
          }
        }
      }
    }

    // Remove duplicates, keeping highest confidence
    const uniqueSuggestions = new Map<
      string,
      { sourceField: string; targetField: string; confidence: number }
    >();

    for (const suggestion of suggestions) {
      const key = suggestion.sourceField;
      const existing = uniqueSuggestions.get(key);

      if (!existing || suggestion.confidence > existing.confidence) {
        uniqueSuggestions.set(key, suggestion);
      }
    }

    return Array.from(uniqueSuggestions.values());
  },

  /**
   * Get auto-detected mappings for a project based on its sources
   */
  async getAutoDetectedMappings(organisationId: number, projectId: number) {
    // Verify project belongs to organisation
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.organisationId, organisationId))
      )
      .limit(1);

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    // Get all source fields from project sources
    const projectSources = await db
      .select({ detectedFields: sources.detectedFields })
      .from(sources)
      .where(eq(sources.projectId, projectId));

    const allFields = new Set<string>();
    for (const source of projectSources) {
      if (source.detectedFields) {
        for (const field of source.detectedFields) {
          allFields.add(field);
        }
      }
    }

    return this.autoDetectMappings(Array.from(allFields));
  },
};
