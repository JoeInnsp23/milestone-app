# Phase 6: Export Functionality Implementation

## Overview
This phase implements comprehensive export functionality for the Milestone P&L Dashboard, including PDF generation for reports and Excel export for data analysis. The export features should maintain visual consistency with the MVP's design and branding.

## UI Reference from Existing MVP
The export functionality should maintain consistency with the MVP:
- **Export Buttons**: Subtle, integrated design matching the dashboard's button styles
- **PDF Reports**: Should mirror the dashboard layout with blue gradient headers and consistent color scheme
- **Excel Exports**: Include proper formatting with colors matching the MVP (green for profit, red for loss)
- **File Naming**: Include "Build By Milestone" branding in exported files
- **Currency Format**: GBP (£) formatting as shown in `.reference/Screenshot*.png` files

## Prerequisites
- Completed Phase 1-5 (Project features and dashboard)
- All database views and queries optimized
- Authentication and authorization working

## Step 1: Install Export Dependencies

### 1.1 Add Required Packages
```bash
# PDF generation (server-side)
npm install pdfkit
npm install --save-dev @types/pdfkit

# Excel generation with streaming
npm install exceljs
npm install --save-dev @types/exceljs

# Date formatting
npm install date-fns

### 1.2 Export Configuration
```typescript
// src/lib/export/config.ts
export const EXPORT_CONFIG = {
  pdf: {
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    fontSize: {
      title: 24,
      heading: 16,
      body: 12,
      small: 10
    },
    colors: {
      primary: '#3b82f6',
      success: '#10b981',
      danger: '#ef4444',
      text: '#1f2937',
      muted: '#6b7280'
    }
  },
  excel: {
    headerColor: 'F3F4F6',
    profitColor: 'D1FAE5',
    lossColor: 'FEE2E2'
  },
  basePath: process.env.NODE_ENV === 'production' ? '/milestone-app' : ''
};
```

## Step 2: Create Export Service Layer

### 2.1 Export Types and Utilities
```typescript
// src/types/export.ts
export interface ExportOptions {
  format: 'pdf' | 'excel';
  template?: 'summary' | 'detailed'; // Pre-built templates only for now
}

export interface ExportMetadata {
  generatedAt: Date;
  generatedBy: string;
  recordCount: number;
  filters: Record<string, any>;
}

// src/lib/export/utils.ts
import { format } from 'date-fns';

export const generateFilename = (
  type: string,
  format: string,
  date = new Date()
): string => {
  const timestamp = format(date, 'yyyy-MM-dd-HHmmss');
  return `milestone-${type}-${timestamp}.${format}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};
```

### 2.2 Database Queries for Export
```typescript
// src/lib/export/queries.ts
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function getProjectExportData(userId: string, projectId?: string) {
  const query = sql`
    SELECT
      p.*,
      pm.revenue,
      pm.costs,
      pm.profit,
      pm.margin,
      pm.invoice_count,
      pm.bill_count,
      pm.last_updated,
      COALESCE(
        JSON_AGG(
          DISTINCT jsonb_build_object(
            'id', i.id,
            'number', i.invoice_number,
            'date', i.issue_date,
            'due_date', i.due_date,
            'amount', i.total,
            'status', i.status
          ) ORDER BY i.issue_date DESC
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'::json
      ) as invoices,
      COALESCE(
        JSON_AGG(
          DISTINCT jsonb_build_object(
            'id', b.id,
            'number', b.bill_number,
            'date', b.date,
            'due_date', b.due_date,
            'amount', b.total,
            'status', b.status
          ) ORDER BY b.date DESC
        ) FILTER (WHERE b.id IS NOT NULL),
        '[]'::json
      ) as bills
    FROM projects p
    LEFT JOIN project_metrics pm ON p.id = pm.project_id
    LEFT JOIN invoices i ON p.id = i.project_id
    LEFT JOIN bills b ON p.id = b.project_id
    WHERE p.user_id = ${userId}
    ${projectId ? sql`AND p.id = ${projectId}` : sql``}
    GROUP BY p.id, pm.project_id, pm.revenue, pm.costs, pm.profit, pm.margin,
             pm.invoice_count, pm.bill_count, pm.last_updated
    ORDER BY p.start_date DESC
  `;

  return await db.execute(query);
}

export async function getMonthlyMetricsExport(userId: string, months = 12) {
  const query = sql`
    WITH monthly_data AS (
      SELECT
        DATE_TRUNC('month', i.issue_date) as month,
        SUM(i.total) as revenue,
        SUM(b.total) as costs,
        SUM(i.total) - SUM(b.total) as profit,
        COUNT(DISTINCT p.id) as project_count
      FROM projects p
      LEFT JOIN invoices i ON p.id = i.project_id
      LEFT JOIN bills b ON p.id = b.project_id
      WHERE p.user_id = ${userId}
        AND i.issue_date >= CURRENT_DATE - INTERVAL '${sql.raw(months.toString())} months'
      GROUP BY DATE_TRUNC('month', i.issue_date)
      ORDER BY month DESC
    )
    SELECT
      month,
      revenue,
      costs,
      profit,
      CASE
        WHEN revenue > 0 THEN profit / revenue
        ELSE 0
      END as margin,
      project_count
    FROM monthly_data
  `;

  return await db.execute(query);
}
```

## Step 3: PDF Export Implementation

### 3.1 Server-Side PDF Generation
```typescript
// src/lib/export/pdf-generator.ts
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { getProjectExportData, getMonthlyMetricsExport } from '@/lib/export/queries';
import { formatCurrency, formatPercentage } from '@/lib/export/utils';
import { EXPORT_CONFIG } from '@/lib/export/config';

// Template: Summary (simple, pre-built template)
export async function generateSummaryPDF(
  userId: string,
  projectId?: string
): Promise<Buffer> {
  // Fetch data
  const projectData = await getProjectExportData(userId, projectId);
  const project = projectData.rows[0];

  if (!project) {
    throw new Error('Project not found');
  }

  // Create PDF document
  const doc = new PDFDocument({
    margin: EXPORT_CONFIG.pdf.margins.top,
    size: 'A4'
  });
  const chunks: Buffer[] = [];

  // Collect PDF data
  doc.on('data', (chunk) => chunks.push(chunk));

  // Header with gradient effect (simulate with rectangle)
  doc.rect(0, 0, doc.page.width, 100)
     .fill(EXPORT_CONFIG.pdf.colors.primary);

  doc.fillColor('white')
     .fontSize(EXPORT_CONFIG.pdf.fontSize.title)
     .text('Project P&L Report', 50, 30, { align: 'center' });

  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.body)
     .text(`${project.name}`, 50, 60, { align: 'center' });

  // Reset to default colors
  doc.fillColor(EXPORT_CONFIG.pdf.colors.text);

  // Move past header
  doc.y = 120;

  // Summary Section
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
     .text('Financial Summary', { underline: true });
  doc.moveDown();

  // KPI Cards simulation
  const kpiY = doc.y;
  const kpiWidth = (doc.page.width - 100) / 3;

  // Revenue
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text('TOTAL REVENUE', 50, kpiY);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
     .fillColor(EXPORT_CONFIG.pdf.colors.text)
     .text(formatCurrency(project.revenue || 0), 50, kpiY + 15);

  // Costs
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text('TOTAL COSTS', 50 + kpiWidth, kpiY);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
     .fillColor(EXPORT_CONFIG.pdf.colors.text)
     .text(formatCurrency(project.costs || 0), 50 + kpiWidth, kpiY + 15);

  // Net Profit
  const profit = (project.revenue || 0) - (project.costs || 0);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text('NET PROFIT', 50 + kpiWidth * 2, kpiY);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
     .fillColor(profit > 0 ? EXPORT_CONFIG.pdf.colors.success : EXPORT_CONFIG.pdf.colors.danger)
     .text(formatCurrency(profit), 50 + kpiWidth * 2, kpiY + 15);

  doc.y = kpiY + 60;
  doc.fillColor(EXPORT_CONFIG.pdf.colors.text);

  // Project Details Table
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
     .text('Project Details', { underline: true });
  doc.moveDown();

  const details = [
    ['Client', project.client_name || 'N/A'],
    ['Status', project.status || 'Active'],
    ['Start Date', project.start_date ? format(new Date(project.start_date), 'MMM dd, yyyy') : 'N/A'],
    ['End Date', project.end_date ? format(new Date(project.end_date), 'MMM dd, yyyy') : 'N/A'],
    ['Margin', formatPercentage((profit / (project.revenue || 1)))]
  ];

  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.body);
  details.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`);
    doc.moveDown(0.5);
  });

  // Footer
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text(
       `Generated on ${format(new Date(), 'MMMM dd, yyyy')} | Milestone P&L Dashboard`,
       50,
       doc.page.height - 50,
       { align: 'center' }
     );

  // Finalize PDF
  doc.end();

  // Wait for PDF generation to complete
  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

// Template: Detailed (includes more data)
export async function generateDetailedPDF(
  userId: string,
  includeAllProjects: boolean = false
): Promise<Buffer> {
  // Fetch data
  const projectsData = await getProjectExportData(userId);
  const monthlyData = await getMonthlyMetricsExport(userId, 12);

  // Create PDF document
  const doc = new PDFDocument({
    margin: EXPORT_CONFIG.pdf.margins.top,
    size: 'A4',
    layout: 'landscape'
  });
  const chunks: Buffer[] = [];

  // Collect PDF data
  doc.on('data', (chunk) => chunks.push(chunk));

  // Header
  doc.rect(0, 0, doc.page.width, 80)
     .fill(EXPORT_CONFIG.pdf.colors.primary);

  doc.fillColor('white')
     .fontSize(EXPORT_CONFIG.pdf.fontSize.title)
     .text('Dashboard Report', 50, 25, { align: 'center' });

  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, 50, 50, { align: 'center' });

  // Reset colors and move past header
  doc.fillColor(EXPORT_CONFIG.pdf.colors.text);
  doc.y = 100;

  // Summary statistics
  const totalRevenue = projectsData.rows.reduce((sum, p) => sum + (p.revenue || 0), 0);
  const totalCosts = projectsData.rows.reduce((sum, p) => sum + (p.costs || 0), 0);
  const totalProfit = totalRevenue - totalCosts;
  const profitableCount = projectsData.rows.filter(p => ((p.revenue || 0) - (p.costs || 0)) > 0).length;

  // KPIs in a row
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
     .text('Key Performance Indicators', { underline: true });
  doc.moveDown();

  const kpiY = doc.y;
  const kpiWidth = (doc.page.width - 100) / 4;

  // Total Projects
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text('TOTAL PROJECTS', 50, kpiY);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.body)
     .fillColor(EXPORT_CONFIG.pdf.colors.text)
     .text(projectsData.rows.length.toString(), 50, kpiY + 15);

  // Total Revenue
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text('TOTAL REVENUE', 50 + kpiWidth, kpiY);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.body)
     .fillColor(EXPORT_CONFIG.pdf.colors.text)
     .text(formatCurrency(totalRevenue), 50 + kpiWidth, kpiY + 15);

  // Net Profit
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text('NET PROFIT', 50 + kpiWidth * 2, kpiY);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.body)
     .fillColor(totalProfit > 0 ? EXPORT_CONFIG.pdf.colors.success : EXPORT_CONFIG.pdf.colors.danger)
     .text(formatCurrency(totalProfit), 50 + kpiWidth * 2, kpiY + 15);

  // Profitable Projects
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text('PROFITABLE', 50 + kpiWidth * 3, kpiY);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.body)
     .fillColor(EXPORT_CONFIG.pdf.colors.text)
     .text(`${profitableCount}/${projectsData.rows.length}`, 50 + kpiWidth * 3, kpiY + 15);

  doc.y = kpiY + 60;

  // Projects table (simplified)
  if (includeAllProjects && projectsData.rows.length > 0) {
    doc.addPage();
    doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
       .text('Projects Summary', { underline: true });
    doc.moveDown();

    // Table headers
    const tableY = doc.y;
    const colWidths = [200, 100, 100, 100, 80];
    const headers = ['Project Name', 'Revenue', 'Costs', 'Net Profit', 'Margin'];

    doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
       .fillColor(EXPORT_CONFIG.pdf.colors.muted);

    let xPos = 50;
    headers.forEach((header, i) => {
      doc.text(header, xPos, tableY);
      xPos += colWidths[i];
    });

    doc.moveDown();

    // Table rows
    doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
       .fillColor(EXPORT_CONFIG.pdf.colors.text);

    projectsData.rows.slice(0, 10).forEach((project) => {
      const rowY = doc.y;
      const profit = (project.revenue || 0) - (project.costs || 0);
      const margin = project.revenue ? (profit / project.revenue) : 0;

      xPos = 50;
      doc.text(project.name || 'Unnamed', xPos, rowY);
      xPos += colWidths[0];
      doc.text(formatCurrency(project.revenue || 0), xPos, rowY);
      xPos += colWidths[1];
      doc.text(formatCurrency(project.costs || 0), xPos, rowY);
      xPos += colWidths[2];
      doc.fillColor(profit > 0 ? EXPORT_CONFIG.pdf.colors.success : EXPORT_CONFIG.pdf.colors.danger)
         .text(formatCurrency(profit), xPos, rowY);
      xPos += colWidths[3];
      doc.fillColor(EXPORT_CONFIG.pdf.colors.text)
         .text(formatPercentage(margin), xPos, rowY);

      doc.moveDown(0.5);
    });
  }

  // Footer on last page
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text(
       'Milestone P&L Dashboard | Confidential',
       50,
       doc.page.height - 50,
       { align: 'center' }
     );

  // Finalize PDF
  doc.end();

  // Wait for PDF generation to complete
  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}
```

### 3.2 Export Server Actions
```typescript
// src/app/actions/export.ts
'use server'

import { auth } from '@clerk/nextjs';
import { generateSummaryPDF, generateDetailedPDF } from '@/lib/export/pdf-generator';
import { ExcelBuilder } from '@/lib/export/excel-builder';
import { generateFilename } from '@/lib/export/utils';
import { db } from '@/lib/db';
import { exportHistory } from '@/db/schema';

export async function exportPDF(
  template: 'summary' | 'detailed' = 'summary',
  projectId?: string
) {
  const { userId } = auth();

  if (!userId) {
    return { error: 'Unauthorized' };
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
      id: crypto.randomUUID(),
      user_id: userId,
      format: 'pdf',
      file_size: buffer.length,
      created_at: new Date(),
    });

    // Convert buffer to base64 for client-side download
    const base64 = buffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;

    return {
      url: dataUrl,
      filename,
      success: true,
    };
  } catch (error) {
    console.error('PDF export error:', error);
    return { error: 'Failed to generate PDF' };
  }
}

export async function exportExcel(
  template: 'summary' | 'detailed' = 'summary',
  projectId?: string
) {
  const { userId } = auth();

  if (!userId) {
    return { error: 'Unauthorized' };
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
      id: crypto.randomUUID(),
      user_id: userId,
      format: 'excel',
      file_size: buffer.length,
      created_at: new Date(),
    });

    // Convert buffer to base64 for client-side download
    const base64 = buffer.toString('base64');
    const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

    return {
      url: dataUrl,
      filename,
      success: true,
    };
  } catch (error) {
    console.error('Excel export error:', error);
    return { error: 'Failed to generate Excel file' };
  }
}
```

## Step 4: Excel Export Implementation

### 4.1 Excel Workbook Builder (Simplified Templates)
```typescript
// src/lib/export/excel-builder.ts
import ExcelJS from 'exceljs';
import { format } from 'date-fns';

import { getProjectExportData, getMonthlyMetricsExport } from '@/lib/export/queries';
import { EXPORT_CONFIG } from '@/lib/export/config';

export class ExcelBuilder {
  private workbook: ExcelJS.Workbook;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.setupWorkbook();
  }

  private setupWorkbook() {
    this.workbook.creator = 'Milestone P&L Dashboard';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
    this.workbook.properties.date1904 = false;
  }

  // Template: Summary (single sheet with key metrics)
  async addSummarySheet(userId: string, projectId?: string) {
    const data = projectId
      ? await getProjectExportData(userId, projectId)
      : await getProjectExportData(userId);

    const sheet = this.workbook.addWorksheet('Summary', {
      properties: { tabColor: { argb: EXPORT_CONFIG.excel.headerColor } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    // Simple summary layout
    if (projectId && data.rows.length > 0) {
      // Single project summary
      const project = data.rows[0];
      sheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 20 },
      ];

      sheet.addRows([
        { metric: 'Project Name', value: project.name },
        { metric: 'Client', value: project.client_name },
        { metric: 'Revenue', value: project.revenue || 0 },
        { metric: 'Costs', value: project.costs || 0 },
        { metric: 'Net Profit', value: (project.revenue || 0) - (project.costs || 0) },
        { metric: 'Margin %', value: `${(((project.revenue || 0) - (project.costs || 0)) / (project.revenue || 1) * 100).toFixed(1)}%` },
      ]);
    } else {
      // Dashboard summary
      sheet.columns = [
        { header: 'Project', key: 'name', width: 30 },
        { header: 'Revenue', key: 'revenue', width: 15 },
        { header: 'Costs', key: 'costs', width: 15 },
        { header: 'Net Profit', key: 'profit', width: 15 },
        { header: 'Margin %', key: 'margin', width: 10 },
      ];

      data.rows.forEach(project => {
        const profit = (project.revenue || 0) - (project.costs || 0);
        sheet.addRow({
          name: project.name,
          revenue: project.revenue || 0,
          costs: project.costs || 0,
          profit: profit,
          margin: `${((profit / (project.revenue || 1)) * 100).toFixed(1)}%`,
        });
      });
    }

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXPORT_CONFIG.excel.headerColor },
    };

    // Format currency columns
    if (!projectId) {
      ['B', 'C', 'D'].forEach(col => {
        for (let row = 2; row <= sheet.rowCount; row++) {
          const cell = sheet.getCell(`${col}${row}`);
          if (typeof cell.value === 'number' && col !== 'E') {
            cell.numFmt = '£#,##0.00';
          }
        }
      });

      // Color code profit column
      for (let row = 2; row <= sheet.rowCount; row++) {
        const profitCell = sheet.getCell(`D${row}`);
        if (typeof profitCell.value === 'number') {
          if (profitCell.value > 0) {
            profitCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: EXPORT_CONFIG.excel.profitColor },
            };
          } else if (profitCell.value < 0) {
            profitCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: EXPORT_CONFIG.excel.lossColor },
            };
          }
        }
      }
    }

    return this;
  }

  // Template: Detailed (multiple sheets with more data)
  async addDetailedSheets(userId: string) {
    // Main summary sheet
    await this.addSummarySheet(userId);

    // Add monthly trends sheet
    const monthlyData = await getMonthlyMetricsExport(userId, 12);
    const trendSheet = this.workbook.addWorksheet('Monthly Trends', {
      properties: { tabColor: { argb: '6366F1' } },
    });

    trendSheet.columns = [
      { header: 'Month', key: 'month', width: 15 },
      { header: 'Revenue', key: 'revenue', width: 15 },
      { header: 'Costs', key: 'costs', width: 15 },
      { header: 'Profit', key: 'profit', width: 15 },
      { header: 'Margin %', key: 'margin', width: 12 },
    ];

    trendSheet.getRow(1).font = { bold: true };
    trendSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXPORT_CONFIG.excel.headerColor },
    };

    monthlyData.rows.forEach(month => {
      trendSheet.addRow({
        month: format(new Date(month.month), 'MMM yyyy'),
        revenue: month.revenue || 0,
        costs: month.costs || 0,
        profit: month.profit || 0,
        margin: `${((month.margin || 0) * 100).toFixed(1)}%`,
      });
    });

    // Format currency columns
    ['B', 'C', 'D'].forEach(col => {
      for (let row = 2; row <= trendSheet.rowCount; row++) {
        const cell = trendSheet.getCell(`${col}${row}`);
        if (typeof cell.value === 'number') {
          cell.numFmt = '£#,##0.00';
        }
      }
    });

    return this;
  }

  async getBuffer(): Promise<Buffer> {
    return await this.workbook.xlsx.writeBuffer() as Buffer;
  }
}
```

### 4.2 Streaming Support for Large Datasets
```typescript
// src/lib/export/excel-stream.ts
import ExcelJS from 'exceljs';
import { getProjectsPaginated } from '@/lib/queries';

export async function streamLargeExcel(
  userId: string,
  onProgress?: (percent: number) => void
): Promise<Buffer> {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    useStyles: true,
    useSharedStrings: true,
  });

  const worksheet = workbook.addWorksheet('All Projects');

  // Add headers
  worksheet.columns = [
    { header: 'Project Name', key: 'name', width: 30 },
    { header: 'Client', key: 'client', width: 20 },
    { header: 'Revenue', key: 'revenue', width: 15 },
    { header: 'Costs', key: 'costs', width: 15 },
    { header: 'Net Profit', key: 'profit', width: 15 },
    { header: 'Margin %', key: 'margin', width: 10 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };

  // Stream data in batches
  let offset = 0;
  const batchSize = 100;
  let hasMore = true;
  let totalProcessed = 0;

  while (hasMore) {
    const projects = await getProjectsPaginated(userId, offset, batchSize);

    if (projects.length === 0) {
      hasMore = false;
      break;
    }

    for (const project of projects) {
      const profit = (project.revenue || 0) - (project.costs || 0);
      worksheet.addRow({
        name: project.name,
        client: project.client_name,
        revenue: project.revenue || 0,
        costs: project.costs || 0,
        profit: profit,
        margin: `${((profit / (project.revenue || 1)) * 100).toFixed(1)}%`,
      }).commit();

      totalProcessed++;
      if (onProgress && totalProcessed % 10 === 0) {
        // Estimate progress (assuming max 1000 projects)
        onProgress(Math.min(totalProcessed / 10, 100));
      }
    }

    offset += batchSize;
    hasMore = projects.length === batchSize;
  }

  await worksheet.commit();
  await workbook.commit();

  // Note: With streaming, we need to handle the buffer differently
  // This is a simplified version - in production, you'd write to a temp file
  const chunks: Buffer[] = [];
  // @ts-ignore - accessing internal stream
  workbook.stream.on('data', (chunk: Buffer) => chunks.push(chunk));

  return new Promise((resolve) => {
    // @ts-ignore
    workbook.stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
```

## Step 5: Export UI Components

### 5.1 Export Button Component (Simplified)
```tsx
// src/components/export/export-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportPDF, exportExcel } from '@/app/actions/export';

interface ExportButtonProps {
  projectId?: string;
  template?: 'summary' | 'detailed';
}

export function ExportButton({
  projectId,
  template = 'summary',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<string | null>(null);

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    setExportFormat(format);

    try {
      // Use Server Actions
      const result = format === 'pdf'
        ? await exportPDF(template, projectId)
        : await exportExcel(template, projectId);

      if (result.error) {
        throw new Error(result.error);
      }

      // Download the file
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = result.url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up data URL
      if (result.url.startsWith('data:')) {
        // Data URLs don't need cleanup
      }

      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
        >
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
          {isExporting && exportFormat === 'pdf' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel
          {isExporting && exportFormat === 'excel' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 5.2 Simplified Export Dialog
```tsx
// src/components/export/export-dialog.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  type: 'dashboard' | 'projects';
  onExport: (options: ExportOptions) => Promise<void>;
}

interface ExportOptions {
  format: 'pdf' | 'excel';
  template: 'summary' | 'detailed';
}

export function ExportDialog({ projectId }: { projectId?: string }) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    template: 'summary',
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = options.format === 'pdf'
        ? await exportPDF(options.template, projectId)
        : await exportExcel(options.template, projectId);

      if (result.error) {
        throw new Error(result.error);
      }

      // Download the file
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('Export completed successfully');
      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Configure your export settings and choose the format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(value) =>
                setOptions({ ...options, format: value as 'pdf' | 'excel' })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="cursor-pointer">
                  PDF Document (.pdf)
                  <span className="block text-xs text-muted-foreground">
                    Best for reports and printing
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="cursor-pointer">
                  Excel Spreadsheet (.xlsx)
                  <span className="block text-xs text-muted-foreground">
                    Best for data analysis and manipulation
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Template Selection */}
          <div className="space-y-3">
            <Label>Template</Label>
            <RadioGroup
              value={options.template}
              onValueChange={(value) =>
                setOptions({ ...options, template: value as 'summary' | 'detailed' })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="summary" id="summary" />
                <Label htmlFor="summary" className="cursor-pointer">
                  Summary Report
                  <span className="block text-xs text-muted-foreground">
                    Key metrics and overview
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed" className="cursor-pointer">
                  Detailed Report
                  <span className="block text-xs text-muted-foreground">
                    Full data with monthly trends
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Step 6: Integration with Existing Pages

### 6.1 Add Export to Dashboard
```tsx
// Update src/app/(authenticated)/dashboard/page.tsx
import { ExportButton } from '@/components/export/export-button';

export default async function DashboardPage() {
  // ... existing code ...

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <ExportButton template="detailed" />
      </div>

      {/* ... rest of dashboard content ... */}
    </div>
  );
}
```

### 6.2 Add Export to Project Detail
```tsx
// Update src/app/(authenticated)/projects/[id]/page.tsx
import { ExportButton } from '@/components/export/export-button';

export default async function ProjectPage({ params }: { params: { id: string } }) {
  // ... existing code ...

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <ExportButton projectId={params.id} template="summary" />
      </div>

      {/* ... rest of project content ... */}
    </div>
  );
}
```

### 6.3 Add Export to Projects List
```tsx
// Update src/app/(authenticated)/projects/page.tsx
import { ExportDialog } from '@/components/export/export-dialog';

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <ExportDialog />
      </div>

      {/* ... rest of projects list ... */}
    </div>
  );
}
```

## Step 7: Production Configuration

### 7.1 basePath Support
```typescript
// Update next.config.mjs to include basePath
const nextConfig = {
  basePath: process.env.NODE_ENV === 'production' ? '/milestone-app' : '',
  // ... other config
};
```

### 7.2 Test Cases
```typescript
// src/__tests__/export.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { ExportButton } from '@/components/export/ExportButton';
import { ExcelBuilder } from '@/lib/export/excel/builder';

describe('Export Functionality', () => {
  describe('PDF Export', () => {
    it('should generate PDF with correct content', async () => {
      // Test PDF generation
    });

    it('should handle large datasets', async () => {
      // Test PDF with many pages
    });

    it('should format currency correctly', async () => {
      // Test number formatting
    });
  });

  describe('Excel Export', () => {
    it('should create workbook with multiple sheets', async () => {
      const builder = new ExcelBuilder();
      builder.addDashboardSheet(mockStats, mockMonthlyData, mockProjects);

      const buffer = await builder.getBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should apply conditional formatting', async () => {
      // Test Excel formatting rules
    });

    it('should stream large datasets', async () => {
      // Test streaming functionality
    });
  });

  describe('Export Dialog', () => {
    it('should update options correctly', async () => {
      // Test option selection
    });

    it('should validate date ranges', async () => {
      // Test date range validation
    });
  });
});
```

## Completion Checklist

### Phase 6 Deliverables:
- [ ] PDF generation with PDFKit (server-side)
- [ ] Excel export with ExcelJS
- [ ] Streaming for large datasets
- [ ] Simplified export dialog with templates
- [ ] Two template options (summary/detailed)
- [ ] Server Actions instead of API routes
- [ ] GBP currency formatting
- [ ] Error handling
- [ ] Export history tracking
- [ ] basePath configuration for production
- [ ] Integration with existing pages

### Export Features:
- [ ] Summary PDF template
- [ ] Detailed PDF template
- [ ] Excel summary sheet
- [ ] Excel detailed sheets with trends
- [ ] GBP currency formatting (£)
- [ ] Color coding (green profit/red loss)
- [ ] Automatic filename generation
- [ ] Export history in database
- [ ] UUID tracking for exports
- [ ] Pre-built templates only (expandable later)

### Performance:
- [ ] Streaming for large files
- [ ] Efficient memory usage
- [ ] Progress feedback
- [ ] Chunked responses
- [ ] Background processing option

## Next Phase Preview

Phase 7 (Deployment) will cover:
1. Coolify deployment setup
2. Docker internal_net configuration
3. Environment variables for production
4. Database connection via Docker network
5. SSL certificate configuration
6. basePath deployment at /milestone-app
7. Health checks and monitoring
8. Backup strategies
9. Security configuration
10. Documentation finalization