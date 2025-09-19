'use server';

import { auth } from '@clerk/nextjs/server';
import { generateSummaryPDF, generateDetailedPDF } from '@/lib/export/pdf-generator';
import { ExcelBuilder } from '@/lib/export/excel-builder';
import { generateFilename } from '@/lib/export/utils';
import { db } from '@/db';
import { exportHistory } from '@/db/schema';
import { ExportResult } from '@/types/export';

export async function exportPDF(
  template: 'summary' | 'detailed' = 'summary',
  projectId?: string
): Promise<ExportResult> {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: 'Unauthorized: Please sign in to export data',
      dataUrl: '',
      filename: ''
    };
  }

  const startTime = Date.now();
  const timeout = 30000; // 30 second timeout

  try {
    // Set up timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Export timeout: The operation took too long')), timeout);
    });

    // Generate PDF with timeout
    const generatePromise = async () => {
      let buffer: Buffer;
      let filename: string;

      if (template === 'summary' && projectId) {
        buffer = await generateSummaryPDF(userId, projectId);
        filename = generateFilename('project-summary', 'pdf');
      } else {
        buffer = await generateDetailedPDF(userId, template === 'detailed');
        filename = generateFilename('dashboard-report', 'pdf');
      }

      // Check file size (10MB limit for base64 encoding)
      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error('File too large: The generated PDF exceeds the maximum size limit of 10MB');
      }

      return { buffer, filename };
    };

    const result = await Promise.race([generatePromise(), timeoutPromise]);
    const { buffer, filename } = result as { buffer: Buffer; filename: string };

    // Log successful export to database
    try {
      await db.insert(exportHistory).values({
        user_id: userId,
        export_type: 'PDF',
        file_size_bytes: buffer.length,
        rows_exported: projectId ? 1 : 0,
        export_scope: projectId ? 'project' : 'dashboard',
        file_name: filename,
        completed_at: new Date(),
      });
    } catch (dbError) {
      console.error('Failed to log export history:', dbError);
      // Continue with export even if logging fails
    }

    // Convert buffer to base64 for client-side download
    const base64 = buffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;

    const duration = Date.now() - startTime;
    console.log(`PDF export completed in ${duration}ms, size: ${buffer.length} bytes`);

    return {
      dataUrl,
      filename,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('PDF export error:', errorMessage, error);

    // Log failed export attempt
    try {
      await db.insert(exportHistory).values({
        user_id: userId,
        export_type: 'PDF',
        file_size_bytes: 0,
        rows_exported: 0,
        export_scope: projectId ? 'project' : 'dashboard',
        file_name: 'failed_export.pdf',
        error_message: errorMessage,
        completed_at: new Date(),
      });
    } catch (dbError) {
      console.error('Failed to log export error:', dbError);
    }

    return {
      success: false,
      error: `Export failed: ${errorMessage}`,
      dataUrl: '',
      filename: ''
    };
  }
}

export async function exportExcel(
  template: 'summary' | 'detailed' = 'summary',
  projectId?: string
): Promise<ExportResult> {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: 'Unauthorized: Please sign in to export data',
      dataUrl: '',
      filename: ''
    };
  }

  const startTime = Date.now();
  const timeout = 30000; // 30 second timeout

  try {
    // Set up timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Export timeout: The operation took too long')), timeout);
    });

    // Generate Excel with timeout
    const generatePromise = async () => {
      const builder = new ExcelBuilder();

      if (template === 'summary') {
        await builder.addSummarySheet(userId, projectId);
      } else {
        await builder.addDetailedSheets(userId);
      }

      const buffer = await builder.getBuffer();

      // Check file size (10MB limit for base64 encoding)
      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error('File too large: The generated Excel file exceeds the maximum size limit of 10MB');
      }

      const filename = generateFilename(
        projectId ? 'project-export' : 'dashboard-export',
        'xlsx'
      );

      return { buffer, filename };
    };

    const result = await Promise.race([generatePromise(), timeoutPromise]);
    const { buffer, filename } = result as { buffer: Buffer; filename: string };

    // Log successful export to database
    try {
      await db.insert(exportHistory).values({
        user_id: userId,
        export_type: 'EXCEL',
        file_size_bytes: buffer.length,
        rows_exported: projectId ? 1 : 0,
        export_scope: projectId ? 'project' : 'dashboard',
        file_name: filename,
        completed_at: new Date(),
      });
    } catch (dbError) {
      console.error('Failed to log export history:', dbError);
      // Continue with export even if logging fails
    }

    // Convert buffer to base64 for client-side download
    const base64 = buffer.toString('base64');
    const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

    const duration = Date.now() - startTime;
    console.log(`Excel export completed in ${duration}ms, size: ${buffer.length} bytes`);

    return {
      dataUrl,
      filename,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Excel export error:', errorMessage, error);

    // Log failed export attempt
    try {
      await db.insert(exportHistory).values({
        user_id: userId,
        export_type: 'EXCEL',
        file_size_bytes: 0,
        rows_exported: 0,
        export_scope: projectId ? 'project' : 'dashboard',
        file_name: 'failed_export.xlsx',
        error_message: errorMessage,
        completed_at: new Date(),
      });
    } catch (dbError) {
      console.error('Failed to log export error:', dbError);
    }

    return {
      success: false,
      error: `Export failed: ${errorMessage}`,
      dataUrl: '',
      filename: ''
    };
  }
}