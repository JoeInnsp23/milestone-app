import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProjectById } from '@/lib/queries';
import { Navigation } from '@/components/dashboard/navigation';
import { ProjectKPISection } from '@/components/projects/project-kpi-section';
import { ProjectFinancialBreakdown } from '@/components/projects/project-financial-breakdown';
import { ProjectTabs } from '@/components/projects/project-tabs';
import { ExportDialog } from '@/components/export/export-dialog';
import { Invoice, Bill } from '@/types';

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const resolvedParams = await params;
  const project = await getProjectById(resolvedParams.id);

  if (!project) {
    notFound();
  }

  // Calculate totals
  const totalRevenue = project.invoices
    .filter((inv) => inv.type === 'ACCREC')
    .reduce((sum, inv) => {
      const total = typeof inv.total === 'string' ? parseFloat(inv.total) : Number(inv.total);
      return sum + (total || 0);
    }, 0);

  const totalCosts = project.bills
    .reduce((sum, bill) => {
      const total = typeof bill.total === 'string' ? parseFloat(bill.total) : Number(bill.total);
      return sum + (total || 0);
    }, 0);

  // Calculate estimate totals
  const estimatedRevenue = (project.estimates || [])
    .filter(est => est.estimate_type === 'revenue')
    .reduce((sum, est) => {
      const amount = typeof est.amount === 'string' ? parseFloat(est.amount) : Number(est.amount);
      return sum + (amount || 0);
    }, 0);

  const estimatedCosts = (project.estimates || [])
    .filter(est => est.estimate_type === 'cost' || est.estimate_type === 'materials')
    .reduce((sum, est) => {
      const amount = typeof est.amount === 'string' ? parseFloat(est.amount) : Number(est.amount);
      return sum + (amount || 0);
    }, 0);

  // Calculate values for financial breakdown (always includes estimates for now)
  const totalRevenueWithEstimates = totalRevenue + estimatedRevenue;
  const totalCostsWithEstimates = totalCosts + estimatedCosts;
  const operatingExpenses = totalCostsWithEstimates * 0.4; // 40% as operating expenses

  return (
    <div className="min-h-screen dashboard-bg-gradient">
      {/* Navigation */}
      <Navigation view="projects" />

      <div className="container">
        {/* Back Button - Outside header card */}
        <Link href="/projects" className="inline-block mb-4">
          <button className="text-sm text-white/80 hover:text-white transition-colors">
            ← Back to All Projects
          </button>
        </Link>

        {/* Header Card */}
        <div className="header-card">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1>{project.name}</h1>
              <div className="subtitle">
                {project.client_name || 'No Client'} -
                {project.start_date && project.end_date ?
                  ` ${new Date(project.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} to ${new Date(project.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}` :
                  ' Date Range Not Set'}
              </div>
            </div>
            <ExportDialog projectId={resolvedParams.id} />
          </div>
        </div>

        {/* Main content with consistent spacing */}
        <div className="space-y-6">
          {/* KPI Cards with Estimates Toggle */}
          <ProjectKPISection
            actualRevenue={totalRevenue}
            actualCosts={totalCosts}
            estimatedRevenue={estimatedRevenue}
            estimatedCosts={estimatedCosts}
          />

          {/* Financial Breakdown - Including Estimates */}
          <ProjectFinancialBreakdown
            revenue={totalRevenueWithEstimates}
            costOfSales={totalCostsWithEstimates * 0.6}
            operatingExpenses={operatingExpenses}
            invoices={project.invoices as Invoice[]}
          />

          {/* Tabs for Invoices, Bills, and Estimates */}
          <ProjectTabs
          projectId={project.id}
          invoices={project.invoices as Invoice[]}
          bills={project.bills as Bill[]}
          estimates={project.estimates || []}
          />
        </div>
      </div>
    </div>
  );
}