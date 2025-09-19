export interface ProjectSummary {
  project_id: string;
  project_name: string;
  client_name: string | null;
  actual_revenue: number;
  actual_costs: number;
  profit: number;
  profit_margin: number;
  project_status: string;
  phase_name?: string;
  estimated_revenue?: number;
  estimated_costs?: number;
  estimated_profit?: number;
  latest_invoice_date?: Date | string | null;
  latest_bill_date?: Date | string | null;
}

export interface DashboardStats {
  total_revenue: number;
  total_costs: number;
  total_profit: number;
  profit_margin: number;
  active_projects: number;
  pending_invoices: number;
  overdue_invoices: number;
  last_sync_time?: Date | null;
  company_name?: string;
  date_from?: Date;
  date_to?: Date;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  costs: number;
  profit: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: Date | string | null;
  due_date: Date | string | null;
  total: number | string | null;
  amount_paid: number | string | null;
  amount_due: number | string | null;
  status: string | null;
  type: string | null;
  contact_name: string | null;
  project_id: string | null;
  line_items?: Array<{ description?: string; amount?: number }>;
  // Additional properties from database are allowed via type assertion
}

export interface Bill {
  id: string;
  bill_number: string | null;
  bill_date: Date | string | null;
  due_date: Date | string | null;
  total: number | string | null;
  amount_paid: number | string | null;
  amount_due: number | string | null;
  status: string | null;
  type: string | null;
  contact_name: string | null;
  project_id: string | null;
  // Additional properties from database are allowed via type assertion
}

export interface ProjectEstimate {
  id: string;
  project_id: string;
  build_phase_id: string | null;
  description: string;
  estimate_type: 'revenue' | 'cost' | 'hours' | 'materials';
  amount: number | string;
  estimate_date: Date | string;
  confidence_level: number | null;
  currency?: string | null;
  notes: string | null;
  valid_from?: Date | string | null;
  valid_until?: Date | string | null;
  created_by: string;
  created_at: Date | string;
  updated_by?: string | null;
  updated_at?: Date | string | null;
  version?: number | null;
  previous_version_id?: string | null;
}

export interface Project {
  id: string;
  name: string;
  client_name: string | null;
  project_manager: string | null;
  start_date: Date | null;
  end_date: Date | null;
  status: string;
  is_active: boolean;
  invoices: Invoice[];
  bills: Bill[];
  estimates: ProjectEstimate[];
}

export interface BuildPhase {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}