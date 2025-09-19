import { auth } from '@clerk/nextjs/server';
import { getDashboardStats, getProjectSummaries } from '@/lib/queries';
import { Navigation } from '@/components/dashboard/navigation';
import { ProjectsPageClient } from '@/components/projects/projects-page-client';
import { ExportDialog } from '@/components/export/export-dialog';
import { format } from 'date-fns';

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const [stats, projectSummaries] = await Promise.all([
    getDashboardStats(),
    getProjectSummaries(),
  ]);

  const projectsMap = new Map();
  projectSummaries.forEach((summary) => {
    const existing = projectsMap.get(summary.project_id) || {
      project_id: summary.project_id,
      project_name: summary.project_name,
      actual_revenue: 0,
      actual_costs: 0,
      profit: 0,
      profit_margin: 0,
    };

    existing.actual_revenue += summary.actual_revenue || 0;
    existing.actual_costs += summary.actual_costs || 0;
    existing.profit = existing.actual_revenue - existing.actual_costs;
    existing.profit_margin = existing.actual_revenue > 0
      ? (existing.profit / existing.actual_revenue) * 100
      : 0;

    projectsMap.set(summary.project_id, existing);
  });

  const projects = Array.from(projectsMap.values());

  const statsTyped = stats as {
    company_name?: string;
    date_from?: Date | string | null;
    date_to?: Date | string | null;
  };

  const companyName = statsTyped.company_name || 'Build By Milestone Ltd';
  const dateFrom = statsTyped.date_from;
  const dateTo = statsTyped.date_to;

  return (
    <div className="min-h-screen dashboard-bg-gradient">
      {/* Navigation */}
      <Navigation view="projects" />

      {/* Main content */}
      <div className="container">
        {/* Header Card */}
        <div className="header-card">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1>Projects P&L Dashboard</h1>
              <div className="subtitle">
                {companyName} - {dateFrom && dateTo ? (
                  <>
                    {format(new Date(dateFrom), 'd MMMM yyyy')} to {format(new Date(dateTo), 'd MMMM yyyy')}
                  </>
                ) : (
                  'All Time'
                )}
              </div>
            </div>
            <ExportDialog />
          </div>
        </div>

        {/* Projects Filter and Table */}
        <ProjectsPageClient projects={projects} />
      </div>
    </div>
  );
}