import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { getProjectExportData, getDashboardExportData } from '@/lib/export/queries';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/export/utils';
import { EXPORT_CONFIG } from '@/lib/export/config';
import type { InvoiceAggregated, ProjectWithAggregates } from '@/types/export';

export async function generateSummaryPDF(
  userId: string,
  projectId?: string
): Promise<Buffer> {
  const result = await getProjectExportData(projectId);

  if (!result.rows || !result.rows.length) {
    throw new Error('No project data found');
  }

  const project = result.rows[0];

  const doc = new PDFDocument({
    margin: EXPORT_CONFIG.pdf.margins.top,
    size: 'A4'
  });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  // Header with gradient effect
  doc.rect(0, 0, doc.page.width, 100)
     .fill(EXPORT_CONFIG.pdf.colors.primary);

  doc.fillColor('white')
     .fontSize(EXPORT_CONFIG.pdf.fontSize.title)
     .text('Project P&L Report', 0, 30, {
       width: doc.page.width,
       align: 'center'
     });

  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.body)
     .text(project.name || 'Unnamed Project', 0, 60, {
       width: doc.page.width,
       align: 'center'
     });

  // Reset to default colors
  doc.fillColor(EXPORT_CONFIG.pdf.colors.text);
  doc.y = 120;

  // Summary Section
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
     .text('Financial Summary', EXPORT_CONFIG.pdf.margins.left, doc.y, { underline: true });
  doc.moveDown();

  // KPI Cards simulation
  const kpiY = doc.y;
  const kpiWidth = (doc.page.width - EXPORT_CONFIG.pdf.margins.left - EXPORT_CONFIG.pdf.margins.right) / 3;

  // Revenue
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text('TOTAL REVENUE', EXPORT_CONFIG.pdf.margins.left, kpiY);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
     .fillColor(EXPORT_CONFIG.pdf.colors.text)
     .text(formatCurrency(Number(project.revenue) || 0), EXPORT_CONFIG.pdf.margins.left, kpiY + 15);

  // Costs
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text('TOTAL COSTS', EXPORT_CONFIG.pdf.margins.left + kpiWidth, kpiY);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
     .fillColor(EXPORT_CONFIG.pdf.colors.text)
     .text(formatCurrency(Number(project.costs) || 0), EXPORT_CONFIG.pdf.margins.left + kpiWidth, kpiY + 15);

  // Net Profit
  const profit = Number(project.profit) || 0;
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text('NET PROFIT', EXPORT_CONFIG.pdf.margins.left + kpiWidth * 2, kpiY);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
     .fillColor(profit > 0 ? EXPORT_CONFIG.pdf.colors.success : EXPORT_CONFIG.pdf.colors.danger)
     .text(formatCurrency(profit), EXPORT_CONFIG.pdf.margins.left + kpiWidth * 2, kpiY + 15);

  doc.y = kpiY + 60;
  doc.fillColor(EXPORT_CONFIG.pdf.colors.text);

  // Project Details Table
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
     .text('Project Details', EXPORT_CONFIG.pdf.margins.left, doc.y, { underline: true });
  doc.moveDown();

  const details = [
    ['Client', project.client_name || 'N/A'],
    ['Status', project.status || 'Active'],
    ['Start Date', formatDate(project.start_date)],
    ['End Date', formatDate(project.end_date)],
    ['Margin', formatPercentage(Number(project.margin) || 0)]
  ];

  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.body);
  details.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, EXPORT_CONFIG.pdf.margins.left);
    doc.moveDown(0.5);
  });

  // Invoices section if exists
  if (project.invoices && Array.isArray(project.invoices) && project.invoices.length > 0) {
    doc.addPage();
    doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
       .text('Invoices', EXPORT_CONFIG.pdf.margins.left, EXPORT_CONFIG.pdf.margins.top, { underline: true });
    doc.moveDown();

    doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small);
    project.invoices.forEach((invoice: InvoiceAggregated) => {
      doc.text(
        `${invoice.invoice_number || 'N/A'} - ${formatDate(invoice.invoice_date)} - ${formatCurrency(Number(invoice.total) || 0)} - ${invoice.status || 'N/A'}`,
        EXPORT_CONFIG.pdf.margins.left
      );
      doc.moveDown(0.5);
    });
  }

  // Footer on last page
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text(
       `Generated on ${format(new Date(), 'MMMM dd, yyyy')} | Build By Milestone`,
       EXPORT_CONFIG.pdf.margins.left,
       doc.page.height - EXPORT_CONFIG.pdf.margins.bottom,
       {
         width: doc.page.width - EXPORT_CONFIG.pdf.margins.left - EXPORT_CONFIG.pdf.margins.right,
         align: 'center'
       }
     );

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

export async function generateDetailedPDF(
  userId: string,
  includeAllProjects: boolean = false
): Promise<Buffer> {
  const dashboardData = await getDashboardExportData();

  const doc = new PDFDocument({
    margin: EXPORT_CONFIG.pdf.margins.top,
    size: 'A4',
    layout: 'landscape'
  });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  // Header
  doc.rect(0, 0, doc.page.width, 80)
     .fill(EXPORT_CONFIG.pdf.colors.primary);

  doc.fillColor('white')
     .fontSize(EXPORT_CONFIG.pdf.fontSize.title)
     .text('Dashboard Report', 0, 25, {
       width: doc.page.width,
       align: 'center'
     });

  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, 0, 50, {
       width: doc.page.width,
       align: 'center'
     });

  doc.fillColor(EXPORT_CONFIG.pdf.colors.text);
  doc.y = 100;

  // Summary statistics
  const stats = dashboardData.stats;
  const totalRevenue = Number(stats?.total_revenue) || 0;
  const totalProfit = Number(stats?.total_profit) || 0;
  const totalProjects = stats?.total_projects || 0;
  const profitableProjects = stats?.profitable_projects || 0;

  // KPIs in a row
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
     .text('Key Performance Indicators', EXPORT_CONFIG.pdf.margins.left, doc.y, { underline: true });
  doc.moveDown();

  const kpiY = doc.y;
  const kpiWidth = (doc.page.width - EXPORT_CONFIG.pdf.margins.left - EXPORT_CONFIG.pdf.margins.right) / 4;

  // Total Projects
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text('TOTAL PROJECTS', EXPORT_CONFIG.pdf.margins.left, kpiY);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.body)
     .fillColor(EXPORT_CONFIG.pdf.colors.text)
     .text(totalProjects.toString(), EXPORT_CONFIG.pdf.margins.left, kpiY + 15);

  // Total Revenue
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text('TOTAL REVENUE', EXPORT_CONFIG.pdf.margins.left + kpiWidth, kpiY);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.body)
     .fillColor(EXPORT_CONFIG.pdf.colors.text)
     .text(formatCurrency(totalRevenue), EXPORT_CONFIG.pdf.margins.left + kpiWidth, kpiY + 15);

  // Net Profit
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text('NET PROFIT', EXPORT_CONFIG.pdf.margins.left + kpiWidth * 2, kpiY);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.body)
     .fillColor(totalProfit > 0 ? EXPORT_CONFIG.pdf.colors.success : EXPORT_CONFIG.pdf.colors.danger)
     .text(formatCurrency(totalProfit), EXPORT_CONFIG.pdf.margins.left + kpiWidth * 2, kpiY + 15);

  // Profitable Projects
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text('PROFITABLE', EXPORT_CONFIG.pdf.margins.left + kpiWidth * 3, kpiY);
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.body)
     .fillColor(EXPORT_CONFIG.pdf.colors.text)
     .text(`${profitableProjects}/${totalProjects}`, EXPORT_CONFIG.pdf.margins.left + kpiWidth * 3, kpiY + 15);

  doc.y = kpiY + 60;

  // Projects table
  if (includeAllProjects && dashboardData.projects.length > 0) {
    doc.addPage();
    doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
       .text('Projects Summary', EXPORT_CONFIG.pdf.margins.left, EXPORT_CONFIG.pdf.margins.top, { underline: true });
    doc.moveDown();

    // Table headers
    const tableY = doc.y;
    const colWidths = [200, 100, 100, 100, 80];
    const headers = ['Project Name', 'Revenue', 'Costs', 'Net Profit', 'Margin'];

    doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
       .fillColor(EXPORT_CONFIG.pdf.colors.muted);

    let xPos = EXPORT_CONFIG.pdf.margins.left;
    headers.forEach((header, i) => {
      doc.text(header, xPos, tableY);
      xPos += colWidths[i];
    });

    doc.moveDown();

    // Table rows
    doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
       .fillColor(EXPORT_CONFIG.pdf.colors.text);

    dashboardData.projects.slice(0, 15).forEach((project: ProjectWithAggregates) => {
      const rowY = doc.y;
      const profit = Number(project.profit) || 0;
      const margin = Number(project.margin) || 0;

      xPos = EXPORT_CONFIG.pdf.margins.left;
      doc.text(project.name || 'Unnamed', xPos, rowY);
      xPos += colWidths[0];
      doc.text(formatCurrency(Number(project.revenue) || 0), xPos, rowY);
      xPos += colWidths[1];
      doc.text(formatCurrency(Number(project.costs) || 0), xPos, rowY);
      xPos += colWidths[2];
      doc.fillColor(profit > 0 ? EXPORT_CONFIG.pdf.colors.success : EXPORT_CONFIG.pdf.colors.danger)
         .text(formatCurrency(profit), xPos, rowY);
      xPos += colWidths[3];
      doc.fillColor(EXPORT_CONFIG.pdf.colors.text)
         .text(formatPercentage(margin), xPos, rowY);

      doc.moveDown(0.5);
    });
  }

  // Monthly trends
  if (dashboardData.monthlyData.length > 0) {
    doc.addPage();
    doc.fontSize(EXPORT_CONFIG.pdf.fontSize.heading)
       .text('Monthly Trends', EXPORT_CONFIG.pdf.margins.left, EXPORT_CONFIG.pdf.margins.top, { underline: true });
    doc.moveDown();

    doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small);
    dashboardData.monthlyData.slice(0, 12).forEach((month) => {
      doc.text(
        `${format(new Date(month.month), 'MMM yyyy')}: Revenue ${formatCurrency(Number(month.revenue) || 0)}, Costs ${formatCurrency(Number(month.costs) || 0)}, Profit ${formatCurrency(Number(month.profit) || 0)}`,
        EXPORT_CONFIG.pdf.margins.left
      );
      doc.moveDown(0.5);
    });
  }

  // Footer on last page
  doc.fontSize(EXPORT_CONFIG.pdf.fontSize.small)
     .fillColor(EXPORT_CONFIG.pdf.colors.muted)
     .text(
       'Build By Milestone | Confidential',
       EXPORT_CONFIG.pdf.margins.left,
       doc.page.height - EXPORT_CONFIG.pdf.margins.bottom,
       {
         width: doc.page.width - EXPORT_CONFIG.pdf.margins.left - EXPORT_CONFIG.pdf.margins.right,
         align: 'center'
       }
     );

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}