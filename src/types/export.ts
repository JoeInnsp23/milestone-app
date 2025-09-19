export interface ExportOptions {
  format: 'pdf' | 'excel';
  template: 'summary' | 'detailed';
}

export interface ExportMetadata {
  generatedAt: Date;
  generatedBy: string;
  recordCount: number;
  filters?: Record<string, unknown>;
}

export interface ExportResult {
  dataUrl: string;
  filename: string;
  success: boolean;
  error?: string;
}

export interface ExportData {
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  projects: ProjectExportData[];
  monthlyData?: MonthlyExportData[];
  invoices?: InvoiceExportData[];
  bills?: BillExportData[];
}

export interface ProjectExportData {
  id: string;
  name: string;
  client_name?: string;
  status?: string;
  start_date?: Date;
  end_date?: Date;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  invoice_count?: number;
  bill_count?: number;
}

export interface MonthlyExportData {
  month: Date;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  project_count: number;
}

export interface InvoiceExportData {
  id: string;
  invoice_number?: string;
  issue_date?: Date;
  due_date?: Date;
  total: number;
  status?: string;
}

export interface BillExportData {
  id: string;
  bill_number?: string;
  date?: Date;
  due_date?: Date;
  total: number;
  status?: string;
  vendor?: string;
}

// Type for Drizzle db.execute() results
export type QueryResult<T = Record<string, unknown>> = {
  rows: T[];
  rowCount?: number;
  fields?: Array<{
    name: string;
    dataTypeID: number;
  }>;
};

// Type for aggregated invoice data from JSON_AGG
export interface InvoiceAggregated {
  id: string;
  invoice_number?: string;
  invoice_date?: string | Date;
  due_date?: string | Date;
  total?: number | string;
  status?: string;
}

// Type for aggregated bill data from JSON_AGG
export interface BillAggregated {
  id: string;
  bill_number?: string;
  bill_date?: string | Date;
  due_date?: string | Date;
  total?: number | string;
  status?: string;
}

// Type for project with aggregated data
export interface ProjectWithAggregates {
  id: string;
  name?: string;
  client_name?: string;
  status?: string;
  start_date?: string | Date;
  end_date?: string | Date;
  revenue?: number | string;
  costs?: number | string;
  profit?: number | string;
  margin?: number | string;
  invoice_count?: number;
  bill_count?: number;
  last_updated?: string | Date;
  invoices?: InvoiceAggregated[] | string;
  bills?: BillAggregated[] | string;
}

// Type for monthly metrics data
export interface MonthlyMetricsRow {
  month: string | Date;
  revenue: number | string;
  costs: number | string;
  profit: number | string;
  margin: number | string;
  project_count: number;
}

// Type for dashboard stats
export interface DashboardStats {
  total_projects: number;
  total_revenue: number | string;
  total_costs: number | string;
  total_profit: number | string;
  profitable_projects: number;
}