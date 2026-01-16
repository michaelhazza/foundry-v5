import { db } from '../db';
import { processingOutputs, processingRuns, projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError } from '../errors';

export const exportService = {
  /**
   * Get export details
   */
  async getExport(organisationId: number, exportId: number) {
    const [result] = await db
      .select({
        export: processingOutputs,
        run: processingRuns,
        project: projects,
      })
      .from(processingOutputs)
      .innerJoin(processingRuns, eq(processingOutputs.runId, processingRuns.id))
      .innerJoin(projects, eq(processingRuns.projectId, projects.id))
      .where(
        and(
          eq(processingOutputs.id, exportId),
          eq(projects.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!result) {
      throw new NotFoundError('Export', exportId);
    }

    return result.export;
  },

  /**
   * Get export content for download
   */
  async downloadExport(organisationId: number, exportId: number) {
    const [result] = await db
      .select({
        export: processingOutputs,
        run: processingRuns,
        project: projects,
      })
      .from(processingOutputs)
      .innerJoin(processingRuns, eq(processingOutputs.runId, processingRuns.id))
      .innerJoin(projects, eq(processingRuns.projectId, projects.id))
      .where(
        and(
          eq(processingOutputs.id, exportId),
          eq(projects.organisationId, organisationId)
        )
      )
      .limit(1);

    if (!result) {
      throw new NotFoundError('Export', exportId);
    }

    const exportData = result.export;

    return {
      content: exportData.content,
      filename: exportData.filename,
      mimeType: getMimeType(exportData.format),
      size: exportData.size,
    };
  },
};

function getMimeType(format: string): string {
  switch (format) {
    case 'jsonl':
      return 'application/x-ndjson';
    case 'qa_pairs':
    case 'raw_json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}
