import { db } from '../db';
import {
  processingRuns,
  processingOutputs,
  entityMappings,
  sources,
  fileSources,
  fieldMappings,
  privacyConfigs,
  privacyRules,
  qualityFilters,
  projects,
} from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { NotFoundError, ConflictError, BadRequestError, ERROR_CODES } from '../errors';
import { fileParserService } from './file-parser.service';
import { deidentificationService } from './deidentification.service';
import { filterService } from './filter.service';
import logger from '../lib/logger';

export const processingService = {
  /**
   * Start processing a project
   */
  async startProcessing(organisationId: number, projectId: number) {
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

    // Check for existing running process
    const [existingRun] = await db
      .select()
      .from(processingRuns)
      .where(
        and(
          eq(processingRuns.projectId, projectId),
          eq(processingRuns.status, 'processing')
        )
      )
      .limit(1);

    if (existingRun) {
      throw new ConflictError('Processing is already in progress', {
        code: ERROR_CODES.PROCESSING_IN_PROGRESS,
        runId: existingRun.id,
      });
    }

    // Get project sources
    const projectSources = await db
      .select()
      .from(sources)
      .where(and(eq(sources.projectId, projectId), eq(sources.status, 'ready')));

    if (projectSources.length === 0) {
      throw new BadRequestError('No ready sources available for processing', {
        code: ERROR_CODES.NO_SOURCES,
      });
    }

    // Get field mappings
    const mappings = await db
      .select()
      .from(fieldMappings)
      .where(eq(fieldMappings.projectId, projectId));

    if (mappings.length === 0) {
      throw new BadRequestError('No field mappings configured', {
        code: ERROR_CODES.NO_MAPPINGS,
      });
    }

    // Create processing run
    const [run] = await db
      .insert(processingRuns)
      .values({
        projectId,
        status: 'processing',
        startedAt: new Date(),
      })
      .returning();

    // Start async processing
    this.processAsync(organisationId, projectId, run.id).catch((error) => {
      logger.error('Processing failed:', error);
      db.update(processingRuns)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Processing failed',
          completedAt: new Date(),
        })
        .where(eq(processingRuns.id, run.id));
    });

    return run;
  },

  /**
   * Async processing logic
   */
  async processAsync(organisationId: number, projectId: number, runId: number) {
    // Get all configuration
    const [config] = await db
      .select()
      .from(privacyConfigs)
      .where(eq(privacyConfigs.projectId, projectId))
      .limit(1);

    const customRules = await db
      .select()
      .from(privacyRules)
      .where(eq(privacyRules.projectId, projectId));

    const filters = await db
      .select()
      .from(qualityFilters)
      .where(eq(qualityFilters.projectId, projectId));

    const mappings = await db
      .select()
      .from(fieldMappings)
      .where(eq(fieldMappings.projectId, projectId));

    // Get file sources
    const projectSources = await db
      .select({
        source: sources,
        fileSource: fileSources,
      })
      .from(sources)
      .leftJoin(fileSources, eq(sources.id, fileSources.sourceId))
      .where(
        and(
          eq(sources.projectId, projectId),
          eq(sources.type, 'file'),
          eq(sources.status, 'ready')
        )
      );

    // Collect all records
    let allRecords: Record<string, unknown>[] = [];

    for (const { source, fileSource } of projectSources) {
      if (!fileSource?.content || !fileSource.mimeType) continue;

      try {
        const parsed = fileParserService.parseFile(
          fileSource.content,
          fileSource.mimeType,
          { sheetName: fileSource.sheetName || undefined }
        );
        allRecords = allRecords.concat(parsed.rows);
      } catch (error) {
        logger.warn({ error }, `Failed to parse source ${source.id}`);
      }
    }

    // Update total records
    await db
      .update(processingRuns)
      .set({ totalRecords: allRecords.length })
      .where(eq(processingRuns.id, runId));

    // Apply filters
    const { passed: filteredRecords, filtered: filteredCount } =
      filterService.applyFilters(allRecords, filters);

    // Apply deidentification
    const privacyConfig = config || {
      detectNames: true,
      detectEmails: true,
      detectPhones: true,
      detectAddresses: true,
      detectCompanies: true,
      detectCreditCards: true,
      detectSsn: true,
    };

    const entityMappingCache = new Map<string, string>();
    const allEntityMappings: Array<{
      entityType: string;
      originalValue: string;
      replacementValue: string;
      occurrences: number;
    }> = [];

    const processedRecords = filteredRecords.map((record, index) => {
      // Apply field mappings
      const mappedRecord: Record<string, unknown> = {};
      for (const mapping of mappings) {
        if (record[mapping.sourceField] !== undefined) {
          mappedRecord[mapping.targetField] = record[mapping.sourceField];
        }
      }

      // Deidentify text fields
      const textFields = ['message_content', 'subject', 'sender_name'];
      for (const field of textFields) {
        if (typeof mappedRecord[field] === 'string') {
          const result = deidentificationService.deidentify(
            mappedRecord[field] as string,
            privacyConfig,
            customRules,
            entityMappingCache
          );
          mappedRecord[field] = result.text;
          allEntityMappings.push(...result.entityMappings);
        }
      }

      // Update progress every 100 records
      if ((index + 1) % 100 === 0) {
        db.update(processingRuns)
          .set({
            progress: Math.floor(((index + 1) / filteredRecords.length) * 100),
            recordsProcessed: index + 1,
          })
          .where(eq(processingRuns.id, runId));
      }

      return mappedRecord;
    });

    // Calculate PII stats
    const piiStats: Record<string, number> = {};
    for (const mapping of allEntityMappings) {
      piiStats[mapping.entityType] =
        (piiStats[mapping.entityType] || 0) + mapping.occurrences;
    }

    // Save entity mappings
    if (allEntityMappings.length > 0) {
      // Deduplicate
      const uniqueMappings = new Map<
        string,
        { entityType: string; originalValue: string; replacementValue: string; occurrences: number }
      >();
      for (const m of allEntityMappings) {
        const key = `${m.entityType}:${m.originalValue}`;
        const existing = uniqueMappings.get(key);
        if (existing) {
          existing.occurrences += m.occurrences;
        } else {
          uniqueMappings.set(key, { ...m });
        }
      }

      await db.insert(entityMappings).values(
        Array.from(uniqueMappings.values()).map((m) => ({
          runId,
          entityType: m.entityType,
          originalValue: m.originalValue,
          replacementValue: m.replacementValue,
          occurrences: m.occurrences,
        }))
      );
    }

    // Generate outputs
    const outputs: Array<{ format: 'jsonl' | 'qa_pairs' | 'raw_json'; content: Buffer; filename: string }> = [];

    // JSONL format
    const jsonlContent = processedRecords.map((r) => JSON.stringify(r)).join('\n');
    outputs.push({
      format: 'jsonl',
      content: Buffer.from(jsonlContent),
      filename: `output_${runId}.jsonl`,
    });

    // Raw JSON format
    outputs.push({
      format: 'raw_json',
      content: Buffer.from(JSON.stringify(processedRecords, null, 2)),
      filename: `output_${runId}.json`,
    });

    // Save outputs
    for (const output of outputs) {
      await db.insert(processingOutputs).values({
        runId,
        format: output.format,
        filename: output.filename,
        content: output.content,
        size: output.content.length,
        recordCount: processedRecords.length,
      });
    }

    // Complete processing
    await db
      .update(processingRuns)
      .set({
        status: 'completed',
        progress: 100,
        recordsProcessed: processedRecords.length,
        recordsFiltered: filteredCount,
        piiStats,
        completedAt: new Date(),
      })
      .where(eq(processingRuns.id, runId));
  },

  /**
   * Get processing status for a project
   */
  async getStatus(organisationId: number, projectId: number) {
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

    const [latestRun] = await db
      .select()
      .from(processingRuns)
      .where(eq(processingRuns.projectId, projectId))
      .orderBy(desc(processingRuns.createdAt))
      .limit(1);

    return latestRun || null;
  },

  /**
   * Get processing history for a project
   */
  async getHistory(organisationId: number, projectId: number) {
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

    const runs = await db
      .select()
      .from(processingRuns)
      .where(eq(processingRuns.projectId, projectId))
      .orderBy(desc(processingRuns.createdAt));

    return runs;
  },

  /**
   * Cancel a processing run
   */
  async cancelProcessing(organisationId: number, projectId: number) {
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

    const [run] = await db
      .select()
      .from(processingRuns)
      .where(
        and(
          eq(processingRuns.projectId, projectId),
          eq(processingRuns.status, 'processing')
        )
      )
      .limit(1);

    if (!run) {
      throw new NotFoundError('Active processing run');
    }

    const [updated] = await db
      .update(processingRuns)
      .set({ status: 'cancelled', completedAt: new Date() })
      .where(eq(processingRuns.id, run.id))
      .returning();

    return updated;
  },

  /**
   * Get run details
   */
  async getRunDetails(organisationId: number, runId: number) {
    const [run] = await db
      .select({
        run: processingRuns,
        project: projects,
      })
      .from(processingRuns)
      .innerJoin(projects, eq(processingRuns.projectId, projects.id))
      .where(
        and(
          eq(processingRuns.id, runId),
          eq(projects.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!run) {
      throw new NotFoundError('Processing run', runId);
    }

    return run.run;
  },

  /**
   * Get run exports
   */
  async getRunExports(organisationId: number, runId: number) {
    // Verify run belongs to organisation
    await this.getRunDetails(organisationId, runId);

    const exports = await db
      .select({
        id: processingOutputs.id,
        format: processingOutputs.format,
        filename: processingOutputs.filename,
        size: processingOutputs.size,
        recordCount: processingOutputs.recordCount,
        createdAt: processingOutputs.createdAt,
      })
      .from(processingOutputs)
      .where(eq(processingOutputs.runId, runId));

    return exports;
  },
};
