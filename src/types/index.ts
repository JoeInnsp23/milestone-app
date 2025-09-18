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