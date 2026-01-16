import { db } from '../db';
import { qualityFilters, projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError } from '../errors';

export interface FilterInput {
  filterType: 'min_messages' | 'min_words' | 'status' | 'date_range' | 'custom';
  config: Record<string, unknown>;
}

export const filterService = {
  /**
   * Get filters for a project
   */
  async getProjectFilters(organisationId: number, projectId: number) {
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

    const filters = await db
      .select()
      .from(qualityFilters)
      .where(eq(qualityFilters.projectId, projectId));

    return filters;
  },

  /**
   * Create a quality filter
   */
  async createFilter(
    organisationId: number,
    projectId: number,
    input: FilterInput
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

    const [filter] = await db
      .insert(qualityFilters)
      .values({
        projectId,
        filterType: input.filterType,
        config: input.config,
      })
      .returning();

    return filter;
  },

  /**
   * Update a filter
   */
  async updateFilter(
    organisationId: number,
    filterId: number,
    input: { config?: Record<string, unknown>; isEnabled?: boolean }
  ) {
    // Get filter and verify ownership
    const [filter] = await db
      .select({
        filter: qualityFilters,
        project: projects,
      })
      .from(qualityFilters)
      .innerJoin(projects, eq(qualityFilters.projectId, projects.id))
      .where(
        and(
          eq(qualityFilters.id, filterId),
          eq(projects.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!filter) {
      throw new NotFoundError('Quality filter', filterId);
    }

    const [updated] = await db
      .update(qualityFilters)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(qualityFilters.id, filterId))
      .returning();

    return updated;
  },

  /**
   * Delete a filter
   */
  async deleteFilter(organisationId: number, filterId: number) {
    // Get filter and verify ownership
    const [filter] = await db
      .select({
        filter: qualityFilters,
        project: projects,
      })
      .from(qualityFilters)
      .innerJoin(projects, eq(qualityFilters.projectId, projects.id))
      .where(
        and(
          eq(qualityFilters.id, filterId),
          eq(projects.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!filter) {
      throw new NotFoundError('Quality filter', filterId);
    }

    await db.delete(qualityFilters).where(eq(qualityFilters.id, filterId));
  },

  /**
   * Apply filters to a set of records
   */
  applyFilters(
    records: Record<string, unknown>[],
    filters: Array<{ filterType: string; config: Record<string, unknown>; isEnabled: boolean }>
  ): { passed: Record<string, unknown>[]; filtered: number } {
    let passed = [...records];
    let totalFiltered = 0;

    for (const filter of filters) {
      if (!filter.isEnabled) continue;

      const beforeCount = passed.length;

      switch (filter.filterType) {
        case 'min_messages':
          const minMessages = (filter.config.minimum as number) || 2;
          passed = passed.filter((record) => {
            const messages = record.messages as unknown[] || [];
            return Array.isArray(messages) && messages.length >= minMessages;
          });
          break;

        case 'min_words':
          const minWords = (filter.config.minimum as number) || 10;
          passed = passed.filter((record) => {
            const content = String(record.content || record.message || '');
            return content.split(/\s+/).filter(Boolean).length >= minWords;
          });
          break;

        case 'status':
          const allowedStatuses = filter.config.statuses as string[] || [];
          if (allowedStatuses.length > 0) {
            passed = passed.filter((record) => {
              const status = String(record.status || '').toLowerCase();
              return allowedStatuses.map(s => s.toLowerCase()).includes(status);
            });
          }
          break;

        case 'date_range':
          const dateFrom = filter.config.dateFrom ? new Date(filter.config.dateFrom as string) : null;
          const dateTo = filter.config.dateTo ? new Date(filter.config.dateTo as string) : null;
          passed = passed.filter((record) => {
            const recordDate = new Date(record.timestamp as string || record.created_at as string || '');
            if (isNaN(recordDate.getTime())) return true;
            if (dateFrom && recordDate < dateFrom) return false;
            if (dateTo && recordDate > dateTo) return false;
            return true;
          });
          break;
      }

      totalFiltered += beforeCount - passed.length;
    }

    return { passed, filtered: totalFiltered };
  },
};
