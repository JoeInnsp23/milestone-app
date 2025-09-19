import { auth } from '@clerk/nextjs/server';
import { getDashboardStats, getProjectSummaries, getMonthlyRevenue, getTopProjects } from '@/lib/queries';
import { Navigation } from '@/components/dashboard/navigation';
import { ProfitChart } from '@/components/dashboard/profit-chart';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { MonthlyTrendWrapper } from '@/components/dashboard/monthly-trend-wrapper';
import { ProjectsTable } from '@/components/dashboard/projects-table';
import { ExportDialog } from '@/components/export/export-dialog';
import { DashboardValidator } from '@/components/dashboard/dashboard-validator';
import { format } from 'date-fns';

interface DashboardPageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const view = params?.view || 'overview';

  // Fetch data using Server Component
  const [statsRaw, projectSummaries, monthlyRevenue, topProjects] = await Promise.all([
    getDashboardStats(),
    getProjectSummaries(),
    getMonthlyRevenue('6m'),
    getTopProjects(10),
  ]);

  // Type the stats object properly
  const stats = statsRaw as unknown as {
    total_revenue: number;
    total_costs: number;
    total_profit: number;
    profit_margin: number;
    active_projects: number;
    pending_invoices: number;
    overdue_invoices: number;
    last_sync_time?: Date | null;
    company_name?: string;
    date_from?: Date | string;
    date_to?: Date | string;
  };

  // Process project summaries to get unique projects with aggregated data
  const projectsMap = new Map();
  projectSummaries.forEach((summary) => {
    const existing = projectsMap.get(summary.project_id) || {
      project_id: summary.project_id,
      project_name: summary.project_name,
      client_name: summary.client_name,
      project_status: summary.project_status,
      actual_revenue: 0,
      actual_costs: 0,
      profit: 0,
      profit_margin: 0,
    };

    existing.actual_revenue += summary.actual_revenue || 0;
    existing.actual_costs += summary.actual_costs || 0;
    existing.profit += summary.profit || 0;

    projectsMap.set(summary.project_id, existing);
  });

  const uniqueProjects = Array.from(projectsMap.values());
  uniqueProjects.forEach(project => {
    project.profit_margin = project.actual_revenue > 0
      ? ((project.profit / project.actual_revenue) * 100)
      : 0;
  });

  // Prepare chart data
  const profitData = topProjects.map((project) => {
    const p = project as Record<string, unknown>;
    const projectName = String(p.project_name || '');
    return {
      name: projectName.length > 20
        ? projectName.substring(0, 20) + '...'
        : projectName,
      profit: Number(p.total_profit || 0),
      margin: Number(p.avg_margin || 0),
    };
  });

  // Calculate revenue breakdown for donut chart
  const totalCosts = stats.total_costs || 0;
  const totalProfit = stats.total_profit || 0;

  const revenueBreakdownData = [
    {
      name: 'Cost of Sales',
      value: Math.abs(totalCosts * 0.6),
      color: '#ef4444',
    },
    {
      name: 'Operating Expenses',
      value: Math.abs(totalCosts * 0.4),
      color: '#fb923c',
    },
    {
      name: 'Net Profit',
      value: Math.max(0, totalProfit),
      color: '#10b981',
    },
  ];

  const profitableProjectsCount = uniqueProjects.filter(p => p.profit > 0).length;
  const totalUniqueProjects = uniqueProjects.length;

  const formattedStats = {
    totalRevenue: stats.total_revenue || 0,
    totalCosts: stats.total_costs || 0,
    totalProfit: stats.total_profit || 0,
    profitMargin: stats.profit_margin || 0,
    activeProjects: totalUniqueProjects, // Use actual unique project count
    profitableProjects: profitableProjectsCount,
  };

  return (
    <DashboardValidator
      expectedRevenue={stats.total_revenue || 0}
      expectedCosts={stats.total_costs || 0}
      expectedProfit={stats.total_profit || 0}
    >
      <div className="min-h-screen dashboard-bg-gradient">
        {/* Navigation */}
        <Navigation view={view} />

        {/* Main content */}
        <div className="container">
        {view === 'overview' ? (
          <>
            {/* Header Card */}
            <div className="header-card">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h1>Project Hub</h1>
                  <div className="subtitle">
                    {stats.company_name || 'Build By Milestone Ltd'} -
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
                <div className="stat-value">{formattedStats.profitableProjects}/{formattedStats.activeProjects} Projects Profitable</div>
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
              {/* TODO: Add Distribution Chart */}
              <div className="chart-card">
                <div className="chart-title">Project Performance Distribution</div>
                <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Coming Soon</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* All Projects View */
          <ProjectsTable projects={uniqueProjects} />
        )}

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
    </DashboardValidator>
  );
}