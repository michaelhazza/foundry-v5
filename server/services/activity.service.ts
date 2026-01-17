import { db } from '../db';
import { activityLogs, users } from '../db/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

export interface CreateActivityInput {
  organisationId: number;
  userId?: number;
  action: string;
  entityType?: string;
  entityId?: number;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ListActivityFilters {
  userId?: number;
  action?: string;
  entityType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export const activityService = {
  /**
   * Log an activity
   */
  async log(input: CreateActivityInput) {
    const [activity] = await db
      .insert(activityLogs)
      .values(input)
      .returning();

    return activity;
  },

  /**
   * List activities for an organisation
   */
  async list(
    organisationId: number,
    filters: ListActivityFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    const offset = (page - 1) * limit;

    const conditions = [eq(activityLogs.organisationId, organisationId)];

    if (filters.userId) {
      conditions.push(eq(activityLogs.userId, filters.userId));
    }

    if (filters.action) {
      conditions.push(eq(activityLogs.action, filters.action));
    }

    if (filters.entityType) {
      conditions.push(eq(activityLogs.entityType, filters.entityType));
    }

    if (filters.dateFrom) {
      conditions.push(gte(activityLogs.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(activityLogs.createdAt, filters.dateTo));
    }

    const activities = await db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt,
      })
      .from(activityLogs)
      .where(and(...conditions))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get user details
    const activitiesWithUsers = await Promise.all(
      activities.map(async (activity) => {
        if (activity.userId) {
          const [user] = await db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, activity.userId))
            .limit(1);

          return { ...activity, user };
        }
        return { ...activity, user: null };
      })
    );

    // Get total count
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(activityLogs)
      .where(and(...conditions));

    return {
      data: activitiesWithUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
