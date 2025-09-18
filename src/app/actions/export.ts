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
      error: 'Unauthorized',
      dataUrl: '',
      filename: ''
    };
  }

  try {
    let buffer: Buffer;
    let filename: string;

    if (template === 'summary' && projectId) {
      buffer = await generateSummaryPDF(userId, projectId);
      filename = generateFilename('project-summary', 'pdf');
    } else {
      buffer = await generateDetailedPDF(userId, template === 'detailed');
      filename = generateFilename('dashboard-report', 'pdf');
    }

    // Log export to database
    await db.insert(exportHistory).values({
      user_id: userId,
      export_type: 'PDF',
      file_size_bytes: buffer.length,
      rows_exported: projectId ? 1 : 0,
      export_scope: projectId ? 'project' : 'dashboard',
      file_name: filename,
      completed_at: new Date(),
    });

    // Convert buffer to base64 for client-side download
    const base64 = buffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;

    return {
      dataUrl,
      filename,
      success: true,
    };
  } catch (error) {
    console.error('PDF export error:', error);
    return {
      success: false,
      error: 'Failed to generate PDF',
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
      error: 'Unauthorized',
      dataUrl: '',
      filename: ''
    };
  }

  try {
    const builder = new ExcelBuilder();

    if (template === 'summary') {
      await builder.addSummarySheet(userId, projectId);
    } else {
      await builder.addDetailedSheets(userId);
    }

    const buffer = await builder.getBuffer();
    const filename = generateFilename(
      projectId ? 'project-export' : 'dashboard-export',
      'xlsx'
    );

    // Log export to database
    await db.insert(exportHistory).values({
      user_id: userId,
      export_type: 'EXCEL',
      file_size_bytes: buffer.length,
      rows_exported: projectId ? 1 : 0,
      export_scope: projectId ? 'project' : 'dashboard',
      file_name: filename,
      completed_at: new Date(),
    });

    // Convert buffer to base64 for client-side download
    const base64 = buffer.toString('base64');
    const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

    return {
      dataUrl,
      filename,
      success: true,
    };
  } catch (error) {
    console.error('Excel export error:', error);
    return {
      success: false,
      error: 'Failed to generate Excel file',
      dataUrl: '',
      filename: ''
    };
  }
}