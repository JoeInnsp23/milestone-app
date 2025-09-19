import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { getProjectExportData, getMonthlyMetricsExport, getDashboardExportData } from '@/lib/export/queries';
import { EXPORT_CONFIG } from '@/lib/export/config';
import { formatDate } from '@/lib/export/utils';
import type { ProjectWithAggregates, InvoiceAggregated, BillAggregated, MonthlyMetricsRow } from '@/types/export';

export class ExcelBuilder {
  private workbook: ExcelJS.Workbook;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.setupWorkbook();
  }

  private setupWorkbook() {
    this.workbook.creator = 'Build By Milestone';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
    this.workbook.properties.date1904 = false;
  }

  async addSummarySheet(userId: string, projectId?: string) {
    const result = projectId
      ? await getProjectExportData(projectId)
      : await getProjectExportData();


    const sheet = this.workbook.addWorksheet('Summary', {
      properties: { tabColor: { argb: EXPORT_CONFIG.excel.primaryColor } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    if (projectId && result.rows && result.rows.length > 0) {
      // Single project summary
      const project = result.rows[0];
      sheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 30 },
      ];

      // Style header row
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: EXPORT_CONFIG.excel.whiteText } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: EXPORT_CONFIG.excel.primaryColor },
      };

      const revenue = Number(project.revenue) || 0;
      const costs = Number(project.costs) || 0;
      const profit = revenue - costs;
      const margin = revenue > 0 ? (profit / revenue) : 0;

      sheet.addRows([
        { metric: 'Project Name', value: project.name },
        { metric: 'Client', value: project.client_name || 'N/A' },
        { metric: 'Status', value: project.status || 'Active' },
        { metric: 'Start Date', value: formatDate(project.start_date) },
        { metric: 'End Date', value: formatDate(project.end_date) },
        { metric: 'Revenue', value: revenue },
        { metric: 'Costs', value: costs },
        { metric: 'Net Profit', value: profit },
        { metric: 'Margin %', value: `${(margin * 100).toFixed(1)}%` },
      ]);

      // Format currency cells
      for (let row = 7; row <= 9; row++) {
        const cell = sheet.getCell(`B${row}`);
        if (typeof cell.value === 'number') {
          cell.numFmt = '£#,##0.00';
        }
      }

      // Color code profit cell
      const profitCell = sheet.getCell('B9');
      if (profit > 0) {
        profitCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: EXPORT_CONFIG.excel.profitColor },
        };
      } else if (profit < 0) {
        profitCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: EXPORT_CONFIG.excel.lossColor },
        };
      }

      // Add invoices sheet if data exists
      if (project.invoices && Array.isArray(project.invoices) && project.invoices.length > 0) {
        const invoiceSheet = this.workbook.addWorksheet('Invoices', {
          properties: { tabColor: { argb: '10b981' } },
        });

        invoiceSheet.columns = [
          { header: 'Invoice Number', key: 'invoice_number', width: 20 },
          { header: 'Invoice Date', key: 'invoice_date', width: 15 },
          { header: 'Due Date', key: 'due_date', width: 15 },
          { header: 'Amount', key: 'total', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
        ];

        const invoiceHeaderRow = invoiceSheet.getRow(1);
        invoiceHeaderRow.font = { bold: true };
        invoiceHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: EXPORT_CONFIG.excel.headerColor },
        };

        project.invoices.forEach((invoice: InvoiceAggregated) => {
          invoiceSheet.addRow({
            invoice_number: invoice.invoice_number || 'N/A',
            invoice_date: formatDate(invoice.invoice_date),
            due_date: formatDate(invoice.due_date),
            total: Number(invoice.total) || 0,
            status: invoice.status || 'N/A',
          });
        });

        // Format amount column
        for (let row = 2; row <= invoiceSheet.rowCount; row++) {
          const cell = invoiceSheet.getCell(`D${row}`);
          if (typeof cell.value === 'number') {
            cell.numFmt = '£#,##0.00';
          }
        }
      }

      // Add bills sheet if data exists
      if (project.bills && Array.isArray(project.bills) && project.bills.length > 0) {
        const billSheet = this.workbook.addWorksheet('Bills', {
          properties: { tabColor: { argb: 'ef4444' } },
        });

        billSheet.columns = [
          { header: 'Bill Number', key: 'bill_number', width: 20 },
          { header: 'Bill Date', key: 'bill_date', width: 15 },
          { header: 'Due Date', key: 'due_date', width: 15 },
          { header: 'Amount', key: 'total', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
        ];

        const billHeaderRow = billSheet.getRow(1);
        billHeaderRow.font = { bold: true };
        billHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: EXPORT_CONFIG.excel.headerColor },
        };

        project.bills.forEach((bill: BillAggregated) => {
          billSheet.addRow({
            bill_number: bill.bill_number || 'N/A',
            bill_date: formatDate(bill.bill_date),
            due_date: formatDate(bill.due_date),
            total: Number(bill.total) || 0,
            status: bill.status || 'N/A',
          });
        });

        // Format amount column
        for (let row = 2; row <= billSheet.rowCount; row++) {
          const cell = billSheet.getCell(`D${row}`);
          if (typeof cell.value === 'number') {
            cell.numFmt = '£#,##0.00';
          }
        }
      }
    } else {
      // Dashboard summary - all projects
      sheet.columns = [
        { header: 'Project', key: 'name', width: 30 },
        { header: 'Client', key: 'client', width: 25 },
        { header: 'Revenue', key: 'revenue', width: 15 },
        { header: 'Costs', key: 'costs', width: 15 },
        { header: 'Net Profit', key: 'profit', width: 15 },
        { header: 'Margin %', key: 'margin', width: 12 },
      ];

      // Style header row
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: EXPORT_CONFIG.excel.whiteText } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: EXPORT_CONFIG.excel.primaryColor },
      };
      headerRow.height = 20;

      (result.rows || []).forEach((project: ProjectWithAggregates) => {
        const revenue = Number(project.revenue) || 0;
        const costs = Number(project.costs) || 0;
        const profit = revenue - costs;
        const margin = revenue > 0 ? (profit / revenue) : 0;

        sheet.addRow({
          name: project.name || 'Unnamed',
          client: project.client_name || 'N/A',
          revenue: revenue,
          costs: costs,
          profit: profit,
          margin: `${(margin * 100).toFixed(1)}%`,
        });
      });

      // Format currency columns
      ['C', 'D', 'E'].forEach(col => {
        for (let row = 2; row <= sheet.rowCount; row++) {
          const cell = sheet.getCell(`${col}${row}`);
          if (typeof cell.value === 'number') {
            cell.numFmt = '£#,##0.00';
          }
        }
      });

      // Color code profit column
      for (let row = 2; row <= sheet.rowCount; row++) {
        const profitCell = sheet.getCell(`E${row}`);
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

      // Add totals row
      const totalRow = sheet.addRow({
        name: 'TOTAL',
        client: '',
        revenue: result.rows.reduce((sum: number, p: ProjectWithAggregates) => sum + (Number(p.revenue) || 0), 0),
        costs: result.rows.reduce((sum: number, p: ProjectWithAggregates) => sum + (Number(p.costs) || 0), 0),
        profit: result.rows.reduce((sum: number, p: ProjectWithAggregates) => sum + ((Number(p.revenue) || 0) - (Number(p.costs) || 0)), 0),
        margin: '',
      });

      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: EXPORT_CONFIG.excel.headerColor },
      };

      // Format totals
      ['C', 'D', 'E'].forEach(col => {
        const cell = sheet.getCell(`${col}${sheet.rowCount}`);
        if (typeof cell.value === 'number') {
          cell.numFmt = '£#,##0.00';
        }
      });
    }

    return this;
  }

  async addDetailedSheets(userId: string) {
    // Main summary sheet
    await this.addSummarySheet(userId);

    // Add monthly trends sheet
    const monthlyResult = await getMonthlyMetricsExport(12);
    const trendSheet = this.workbook.addWorksheet('Monthly Trends', {
      properties: { tabColor: { argb: '6366F1' } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    trendSheet.columns = [
      { header: 'Month', key: 'month', width: 15 },
      { header: 'Revenue', key: 'revenue', width: 15 },
      { header: 'Costs', key: 'costs', width: 15 },
      { header: 'Profit', key: 'profit', width: 15 },
      { header: 'Margin %', key: 'margin', width: 12 },
      { header: 'Projects', key: 'project_count', width: 10 },
    ];

    const trendHeaderRow = trendSheet.getRow(1);
    trendHeaderRow.font = { bold: true, color: { argb: EXPORT_CONFIG.excel.whiteText } };
    trendHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '6366F1' },
    };
    trendHeaderRow.height = 25;

    let totalRevenue = 0;
    let totalCosts = 0;
    let rowIndex = 2;

    (monthlyResult.rows || []).forEach((month: MonthlyMetricsRow) => {
      const revenue = Number(month.revenue) || 0;
      const costs = Number(month.costs) || 0;
      const profit = Number(month.profit) || 0;
      const margin = Number(month.margin) || 0;

      totalRevenue += revenue;
      totalCosts += costs;

      const row = trendSheet.addRow({
        month: month.month ? format(new Date(month.month), 'MMM yyyy') : 'N/A',
        revenue: revenue,
        costs: costs,
        profit: profit,
        margin: `${(margin * 100).toFixed(1)}%`,
        project_count: month.project_count || 0,
      });
      rowIndex++;
    });

    // Add totals row with formulas
    const totalRow = trendSheet.addRow({
      month: 'TOTAL',
      revenue: { formula: `SUM(B2:B${rowIndex - 1})` },
      costs: { formula: `SUM(C2:C${rowIndex - 1})` },
      profit: { formula: `SUM(D2:D${rowIndex - 1})` },
      margin: { formula: `IF(B${rowIndex}=0,0,D${rowIndex}/B${rowIndex})`, result: 0 },
      project_count: { formula: `SUM(F2:F${rowIndex - 1})` },
    });
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXPORT_CONFIG.excel.headerColor },
    };

    // Format currency columns
    ['B', 'C', 'D'].forEach(col => {
      for (let row = 2; row <= trendSheet.rowCount; row++) {
        const cell = trendSheet.getCell(`${col}${row}`);
        if (typeof cell.value === 'number' || (typeof cell.value === 'object' && cell.value !== null && 'formula' in cell.value)) {
          cell.numFmt = '£#,##0.00';
        }
      }
    });

    // Format margin column
    const marginCol = trendSheet.getCell(`E${rowIndex}`);
    marginCol.numFmt = '0.0%';

    // Color code profit column with conditional formatting
    for (let row = 2; row <= trendSheet.rowCount - 1; row++) {
      const profitCell = trendSheet.getCell(`D${row}`);
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

    // Add Dashboard Stats sheet
    const dashboardData = await getDashboardExportData();
    const statsSheet = this.workbook.addWorksheet('Dashboard Stats', {
      properties: { tabColor: { argb: '3b82f6' } },
    });

    statsSheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
      { header: 'Details', key: 'details', width: 40 },
    ];

    const statsHeaderRow = statsSheet.getRow(1);
    statsHeaderRow.font = { bold: true, color: { argb: EXPORT_CONFIG.excel.whiteText } };
    statsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXPORT_CONFIG.excel.primaryColor },
    };
    statsHeaderRow.height = 25;

    const stats = dashboardData.stats;
    const totalProfit = Number(stats?.total_profit) || 0;
    const successRate = (stats?.profitable_projects || 0) / (stats?.total_projects || 1) * 100;

    const metricsRows = [
      {
        metric: 'Total Projects',
        value: stats?.total_projects || 0,
        details: `${stats?.profitable_projects || 0} profitable, ${(stats?.total_projects || 0) - (stats?.profitable_projects || 0)} unprofitable`
      },
      {
        metric: 'Total Revenue',
        value: Number(stats?.total_revenue) || 0,
        details: 'Sum of all project revenues'
      },
      {
        metric: 'Total Costs',
        value: Number(stats?.total_costs) || 0,
        details: 'Sum of all project costs'
      },
      {
        metric: 'Total Profit',
        value: totalProfit,
        details: totalProfit >= 0 ? 'Net positive performance' : 'Net negative performance'
      },
      {
        metric: 'Profitable Projects',
        value: stats?.profitable_projects || 0,
        details: `${successRate.toFixed(1)}% success rate`
      },
      {
        metric: 'Average Margin',
        value: `${((Number(stats?.total_profit) || 0) / (Number(stats?.total_revenue) || 1) * 100).toFixed(1)}%`,
        details: 'Overall profit margin across all projects'
      },
    ];

    metricsRows.forEach((row, index) => {
      const addedRow = statsSheet.addRow(row);

      // Format specific cells
      if (index >= 1 && index <= 3 && typeof row.value === 'number') {
        const cell = statsSheet.getCell(`B${addedRow.number}`);
        cell.numFmt = '£#,##0.00';

        // Color code profit row
        if (index === 3) {
          if (row.value > 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: EXPORT_CONFIG.excel.profitColor },
            };
          } else if (row.value < 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: EXPORT_CONFIG.excel.lossColor },
            };
          }
        }
      }
    });

    // Add chart data preparation sheet
    const chartSheet = this.workbook.addWorksheet('Chart Data', {
      properties: { tabColor: { argb: '10b981' } },
      state: 'hidden', // Hide this sheet as it's for chart creation
    });

    chartSheet.columns = [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Value', key: 'value', width: 15 },
    ];

    chartSheet.addRows([
      { category: 'Revenue', value: Number(stats?.total_revenue) || 0 },
      { category: 'Costs', value: Number(stats?.total_costs) || 0 },
      { category: 'Profit', value: Number(stats?.total_profit) || 0 },
    ]);

    // Format the chart data
    for (let row = 2; row <= 4; row++) {
      const cell = chartSheet.getCell(`B${row}`);
      if (typeof cell.value === 'number') {
        cell.numFmt = '£#,##0.00';
      }
    }

    return this;
  }

  async getBuffer(): Promise<Buffer> {
    const buffer = await this.workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}