import { db } from '../db';
import { sources, fileSources, apiConnections, projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError } from '../errors';
import { fileParserService, type ParseResult } from './file-parser.service';

export interface CreateFileSourceInput {
  projectId: number;
  name: string;
  content: Buffer;
  mimeType: string;
  originalFilename: string;
  sheetName?: string;
}

export interface CreateApiSourceInput {
  projectId: number;
  name: string;
  provider: string;
  encryptedCredentials: string;
  config?: Record<string, unknown>;
}

export const sourceService = {
  /**
   * Create a file source
   */
  async createFileSource(
    organisationId: number,
    input: CreateFileSourceInput
  ) {
    // Verify project belongs to organisation
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, input.projectId),
          eq(projects.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!project) {
      throw new NotFoundError('Project', input.projectId);
    }

    // Parse file to detect fields
    let parseResult: ParseResult;
    try {
      parseResult = fileParserService.parseFile(input.content, input.mimeType, {
        sheetName: input.sheetName,
      });
    } catch (error) {
      // Create source with error status
      const [source] = await db
        .insert(sources)
        .values({
          projectId: input.projectId,
          type: 'file',
          name: input.name,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Failed to parse file',
        })
        .returning();

      await db.insert(fileSources).values({
        sourceId: source.id,
        content: input.content,
        mimeType: input.mimeType,
        size: input.content.length,
        originalFilename: input.originalFilename,
        sheetName: input.sheetName,
      });

      return { ...source, fileSource: { size: input.content.length, originalFilename: input.originalFilename } };
    }

    // Create source with ready status
    const [source] = await db
      .insert(sources)
      .values({
        projectId: input.projectId,
        type: 'file',
        name: input.name,
        status: 'ready',
        recordCount: parseResult.totalRows,
        detectedFields: parseResult.fields,
      })
      .returning();

    await db.insert(fileSources).values({
      sourceId: source.id,
      content: input.content,
      mimeType: input.mimeType,
      size: input.content.length,
      originalFilename: input.originalFilename,
      sheetName: input.sheetName,
    });

    return {
      ...source,
      fileSource: {
        size: input.content.length,
        originalFilename: input.originalFilename,
        sheetName: input.sheetName,
      },
    };
  },

  /**
   * Create an API source
   */
  async createApiSource(
    organisationId: number,
    input: CreateApiSourceInput
  ) {
    // Verify project belongs to organisation
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, input.projectId),
          eq(projects.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!project) {
      throw new NotFoundError('Project', input.projectId);
    }

    // Create source with pending status
    const [source] = await db
      .insert(sources)
      .values({
        projectId: input.projectId,
        type: 'api',
        name: input.name,
        status: 'pending',
      })
      .returning();

    await db.insert(apiConnections).values({
      sourceId: source.id,
      provider: input.provider,
      encryptedCredentials: input.encryptedCredentials,
      config: input.config,
    });

    return source;
  },

  /**
   * Get sources for a project
   */
  async getProjectSources(organisationId: number, projectId: number) {
    // Verify project belongs to organisation
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    const sourceList = await db
      .select()
      .from(sources)
      .where(eq(sources.projectId, projectId));

    return sourceList;
  },

  /**
   * Get source by ID
   */
  async getSource(organisationId: number, sourceId: number) {
    const [source] = await db
      .select({
        source: sources,
        project: projects,
      })
      .from(sources)
      .innerJoin(projects, eq(sources.projectId, projects.id))
      .where(
        and(
          eq(sources.id, sourceId),
          eq(projects.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!source) {
      throw new NotFoundError('Source', sourceId);
    }

    // Get type-specific data
    if (source.source.type === 'file') {
      const [fileData] = await db
        .select({
          mimeType: fileSources.mimeType,
          size: fileSources.size,
          originalFilename: fileSources.originalFilename,
          sheetName: fileSources.sheetName,
        })
        .from(fileSources)
        .where(eq(fileSources.sourceId, sourceId))
        .limit(1);

      return { ...source.source, fileSource: fileData };
    }

    if (source.source.type === 'api') {
      const [apiData] = await db
        .select({
          provider: apiConnections.provider,
          config: apiConnections.config,
          lastSyncAt: apiConnections.lastSyncAt,
        })
        .from(apiConnections)
        .where(eq(apiConnections.sourceId, sourceId))
        .limit(1);

      return { ...source.source, apiConnection: apiData };
    }

    return source.source;
  },

  /**
   * Delete a source
   */
  async deleteSource(organisationId: number, sourceId: number) {
    // Verify source belongs to organisation's project
    const source = await this.getSource(organisationId, sourceId);

    await db.delete(sources).where(eq(sources.id, sourceId));

    return source;
  },

  /**
   * Get source preview (first N rows)
   */
  async getSourcePreview(organisationId: number, sourceId: number, limit: number = 10) {
    const source = await this.getSource(organisationId, sourceId);

    if (source.type !== 'file') {
      throw new NotFoundError('File source', sourceId);
    }

    // Get file content
    const [fileData] = await db
      .select()
      .from(fileSources)
      .where(eq(fileSources.sourceId, sourceId))
      .limit(1);

    if (!fileData || !fileData.content) {
      return { fields: source.detectedFields || [], rows: [] };
    }

    const parseResult = fileParserService.parseFile(
      fileData.content,
      fileData.mimeType!,
      { sheetName: fileData.sheetName || undefined }
    );

    return {
      fields: parseResult.fields,
      rows: parseResult.rows.slice(0, limit),
      totalRows: parseResult.totalRows,
    };
  },
};
