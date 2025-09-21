import { auth } from '@clerk/nextjs/server';
import { getDashboardStats, getProjectSummaries, getMonthlyRevenue, getTopProjects, getTopProjectsPhaseProgress } from '@/lib/queries';
import { runDashboardValidation } from '@/lib/server-validation';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

interface DashboardPageProps {
  searchParams: Promise<{ view?: string }>;
}

async function DashboardData() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const view = 'overview';

  // Fetch data using Server Component
  const [statsRaw, projectSummaries, monthlyRevenue, topProjects, phaseProgress] = await Promise.all([
    getDashboardStats(),
    getProjectSummaries(),
    getMonthlyRevenue('6m'),
    getTopProjects(10),
    getTopProjectsPhaseProgress(3),
  ]);

  // Run server-side validation in development
  await runDashboardValidation(statsRaw);

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
    activeProjects: totalUniqueProjects,
    profitableProjects: profitableProjectsCount,
  };

  const { DashboardContent } = await import('@/components/dashboard/dashboard-content');

  return (
    <DashboardContent
      view={view}
      stats={stats}
      formattedStats={formattedStats}
      profitData={profitData}
      revenueBreakdownData={revenueBreakdownData}
      monthlyRevenue={monthlyRevenue}
      phaseProgress={phaseProgress}
    />
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;

  if (params?.view === 'all') {
    redirect('/projects');
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}
