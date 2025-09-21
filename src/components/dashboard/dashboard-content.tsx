'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/dashboard/navigation';
import { ProfitChart } from '@/components/dashboard/profit-chart';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { MonthlyTrendWrapper } from '@/components/dashboard/monthly-trend-wrapper';
import { ProjectProgressChart } from '@/components/dashboard/project-progress-chart';
import { ExportDialog } from '@/components/export/export-dialog';
import { format } from 'date-fns';
import { useTheme } from '@/components/theme-provider';

interface DashboardContentProps {
  view: string;
  stats: {
    total_revenue?: number;
    total_costs?: number;
    total_profit?: number;
    profit_margin?: number;
    active_projects?: number;
    pending_invoices?: number;
    overdue_invoices?: number;
    last_sync_time?: Date | null;
    company_name?: string;
    date_from?: Date | string;
    date_to?: Date | string;
  };
  formattedStats: {
    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
    profitMargin: number;
    activeProjects: number;
    profitableProjects: number;
  };
  profitData: Array<{
    name: string;
    profit: number;
    margin: number;
  }>;
  revenueBreakdownData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  monthlyRevenue: Array<Record<string, unknown>>;
  phaseProgress: Array<{
    projectId: string;
    projectName: string;
    phases: Array<{
      phaseId: string;
      phaseName: string;
      color: string;
      progress: number;
      displayOrder: number;
    }>;
  }>;
}

export function DashboardContent({
  view,
  stats,
  formattedStats,
  profitData,
  revenueBreakdownData,
  monthlyRevenue,
  phaseProgress
}: DashboardContentProps) {
  const { mounted } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure everything is ready
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen dashboard-bg-gradient transition-opacity duration-300 ${isVisible && mounted ? 'opacity-100' : 'opacity-0'}`}>
        {/* Navigation */}
        <Navigation view={view} />

        {/* Main content */}
        <div className="container">
        <>
            {/* Header Card */}
            <div className="header-card">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h1>{stats.company_name || 'Company Ltd'}</h1>
                  <div className="subtitle">
                    {stats.date_from && stats.date_to ?
                      ` ${format(new Date(stats.date_from), 'd MMMM yyyy')} to ${format(new Date(stats.date_to), 'd MMMM yyyy')}` :
                      ' All Time'}
                  </div>
                </div>
                <ExportDialog />
              </div>
            </div>

            {/* KPI Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">TOTAL PROJECTS</div>
                <div className="stat-value">{formattedStats.activeProjects}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">TOTAL REVENUE</div>
                <div className="stat-value">£{formattedStats.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">NET PROFIT</div>
                <div className={`stat-value ${formattedStats.totalProfit >= 0 ? 'positive' : 'negative'}`}>
                  £{formattedStats.totalProfit.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">PROFITABLE PROJECTS</div>
                <div className="stat-value">{formattedStats.profitableProjects}/{formattedStats.activeProjects}</div>
              </div>
            </div>

            {/* Charts Grid - 2x2 */}
            <div className="chart-grid">
              <div className="chart-card">
                <div className="chart-title">Top 10 Projects by Net Profit</div>
                <ProfitChart data={profitData} />
              </div>
              <div className="chart-card">
                <div className="chart-title">Revenue Breakdown</div>
                <RevenueChart data={revenueBreakdownData} />
              </div>
              <MonthlyTrendWrapper
                initialData={Array.isArray(monthlyRevenue) ? monthlyRevenue.map((item: Record<string, unknown>) => ({
                  month: String(item.month || ''),
                  revenue: Number(item.revenue || 0),
                  costs: Number(item.costs || 0),
                  profit: Number(item.profit || 0)
                })) : []}
              />
              <div className="chart-card">
                <div className="chart-title">Project Progress</div>
                <ProjectProgressChart data={phaseProgress} />
              </div>
            </div>
        </>

        {/* Sync Status */}
        {stats.last_sync_time && (
          <div className="dashboard-card">
            <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
              <span>Data last synchronized from Xero</span>
              <span className="font-medium">
                {format(new Date(stats.last_sync_time), 'PPpp')}
              </span>
            </div>
          </div>
        )}
        </div>
      </div>
  );
}