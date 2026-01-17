import { db } from '../db';
import { privacyConfigs, privacyRules, projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError } from '../errors';

export interface PrivacyConfigInput {
  detectNames?: boolean;
  detectEmails?: boolean;
  detectPhones?: boolean;
  detectAddresses?: boolean;
  detectCompanies?: boolean;
  detectCreditCards?: boolean;
  detectSsn?: boolean;
}

export interface PrivacyRuleInput {
  name: string;
  pattern: string;
  replacement: string;
}

export const privacyService = {
  /**
   * Get privacy config for a project
   */
  async getProjectConfig(organisationId: number, projectId: number) {
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

    let [config] = await db
      .select()
      .from(privacyConfigs)
      .where(eq(privacyConfigs.projectId, projectId))
      .limit(1);

    // Create default config if none exists
    if (!config) {
      [config] = await db
        .insert(privacyConfigs)
        .values({ projectId })
        .returning();
    }

    return config;
  },

  /**
   * Update privacy config for a project
   */
  async updateProjectConfig(
    organisationId: number,
    projectId: number,
    input: PrivacyConfigInput
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

    // Check if config exists
    const [existingConfig] = await db
      .select()
      .from(privacyConfigs)
      .where(eq(privacyConfigs.projectId, projectId))
      .limit(1);

    if (existingConfig) {
      // Update existing
      const [updated] = await db
        .update(privacyConfigs)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(privacyConfigs.projectId, projectId))
        .returning();
      return updated;
    } else {
      // Create new
      const [created] = await db
        .insert(privacyConfigs)
        .values({ projectId, ...input })
        .returning();
      return created;
    }
  },

  /**
   * Get custom privacy rules for a project
   */
  async getProjectRules(organisationId: number, projectId: number) {
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

    const rules = await db
      .select()
      .from(privacyRules)
      .where(eq(privacyRules.projectId, projectId));

    return rules;
  },

  /**
   * Create a custom privacy rule
   */
  async createRule(
    organisationId: number,
    projectId: number,
    input: PrivacyRuleInput
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

    const [rule] = await db
      .insert(privacyRules)
      .values({
        projectId,
        name: input.name,
        pattern: input.pattern,
        replacement: input.replacement,
      })
      .returning();

    return rule;
  },

  /**
   * Update a privacy rule
   */
  async updateRule(
    organisationId: number,
    ruleId: number,
    input: Partial<PrivacyRuleInput> & { isEnabled?: boolean }
  ) {
    // Get rule and verify ownership
    const [rule] = await db
      .select({
        rule: privacyRules,
        project: projects,
      })
      .from(privacyRules)
      .innerJoin(projects, eq(privacyRules.projectId, projects.id))
      .where(
        and(
          eq(privacyRules.id, ruleId),
          eq(projects.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!rule) {
      throw new NotFoundError('Privacy rule', ruleId);
    }

    const [updated] = await db
      .update(privacyRules)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(privacyRules.id, ruleId))
      .returning();

    return updated;
  },

  /**
   * Delete a privacy rule
   */
  async deleteRule(organisationId: number, ruleId: number) {
    // Get rule and verify ownership
    const [rule] = await db
      .select({
        rule: privacyRules,
        project: projects,
      })
      .from(privacyRules)
      .innerJoin(projects, eq(privacyRules.projectId, projects.id))
      .where(
        and(
          eq(privacyRules.id, ruleId),
          eq(projects.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!rule) {
      throw new NotFoundError('Privacy rule', ruleId);
    }

    await db.delete(privacyRules).where(eq(privacyRules.id, ruleId));
  },
};
