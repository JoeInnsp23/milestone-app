export interface ExportOptions {
  format: 'pdf' | 'excel';
  template: 'summary' | 'detailed';
}

export interface ExportMetadata {
  generatedAt: Date;
  generatedBy: string;
  recordCount: number;
  filters?: Record<string, any>;
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