import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { BadRequestError, ERROR_CODES } from '../errors';

export interface ParseResult {
  fields: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

export const fileParserService = {
  /**
   * Parse CSV content
   */
  parseCSV(content: Buffer, encoding: BufferEncoding = 'utf-8'): ParseResult {
    const text = content.toString(encoding);

    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (result.errors.length > 0) {
      const firstError = result.errors[0];
      throw new BadRequestError(`CSV parse error: ${firstError.message}`, {
        code: ERROR_CODES.FILE_PARSE_ERROR,
        row: firstError.row,
      });
    }

    const data = result.data as Record<string, unknown>[];
    const fields = result.meta.fields || [];

    return {
      fields,
      rows: data,
      totalRows: data.length,
    };
  },

  /**
   * Parse Excel content
   */
  parseExcel(content: Buffer, sheetName?: string): ParseResult {
    const workbook = XLSX.read(content, { type: 'buffer' });

    // Get sheet names
    const sheetNames = workbook.SheetNames;

    if (sheetNames.length === 0) {
      throw new BadRequestError('Excel file contains no sheets', {
        code: ERROR_CODES.FILE_PARSE_ERROR,
      });
    }

    // Select sheet
    const targetSheet = sheetName || sheetNames[0];
    if (!sheetNames.includes(targetSheet)) {
      throw new BadRequestError(`Sheet "${targetSheet}" not found`, {
        code: ERROR_CODES.FILE_PARSE_ERROR,
        availableSheets: sheetNames,
      });
    }

    const worksheet = workbook.Sheets[targetSheet];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
    });

    // Extract field names from first row
    const fields = data.length > 0 ? Object.keys(data[0]) : [];

    return {
      fields,
      rows: data,
      totalRows: data.length,
    };
  },

  /**
   * Parse JSON content
   */
  parseJSON(content: Buffer): ParseResult {
    let data: unknown;

    try {
      data = JSON.parse(content.toString('utf-8'));
    } catch {
      throw new BadRequestError('Invalid JSON format', {
        code: ERROR_CODES.FILE_PARSE_ERROR,
      });
    }

    // Handle array of objects
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return { fields: [], rows: [], totalRows: 0 };
      }

      if (typeof data[0] !== 'object' || data[0] === null) {
        throw new BadRequestError('JSON array must contain objects', {
          code: ERROR_CODES.FILE_PARSE_ERROR,
        });
      }

      const fields = Object.keys(data[0] as Record<string, unknown>);
      return {
        fields,
        rows: data as Record<string, unknown>[],
        totalRows: data.length,
      };
    }

    // Handle single object with data array
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;

      // Look for common data keys
      for (const key of ['data', 'rows', 'records', 'items']) {
        if (Array.isArray(obj[key])) {
          const arr = obj[key] as Record<string, unknown>[];
          if (arr.length > 0 && typeof arr[0] === 'object') {
            return {
              fields: Object.keys(arr[0]),
              rows: arr,
              totalRows: arr.length,
            };
          }
        }
      }

      // Treat as single record
      return {
        fields: Object.keys(obj),
        rows: [obj],
        totalRows: 1,
      };
    }

    throw new BadRequestError('JSON must be an array of objects or an object', {
      code: ERROR_CODES.FILE_PARSE_ERROR,
    });
  },

  /**
   * Get Excel sheet names
   */
  getExcelSheets(content: Buffer): string[] {
    const workbook = XLSX.read(content, { type: 'buffer' });
    return workbook.SheetNames;
  },

  /**
   * Auto-detect file type and parse
   */
  parseFile(
    content: Buffer,
    mimeType: string,
    options?: { sheetName?: string }
  ): ParseResult {
    if (
      mimeType === 'text/csv' ||
      mimeType === 'application/csv'
    ) {
      return this.parseCSV(content);
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel'
    ) {
      return this.parseExcel(content, options?.sheetName);
    }

    if (mimeType === 'application/json') {
      return this.parseJSON(content);
    }

    throw new BadRequestError(`Unsupported file type: ${mimeType}`, {
      code: ERROR_CODES.INVALID_FILE_TYPE,
      supportedTypes: ['text/csv', 'application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    });
  },
};
