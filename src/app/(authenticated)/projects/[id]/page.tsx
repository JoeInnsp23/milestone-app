import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { getProjectById } from '@/lib/queries';
import { Navigation } from '@/components/dashboard/navigation';
import { ProjectDetailClient } from '@/components/projects/project-detail-client';
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
        <ProjectDetailClient
          projectId={resolvedParams.id}
          projectName={project.name}
          clientName={project.client_name || undefined}
          startDate={project.start_date ? new Date(project.start_date) : undefined}
          endDate={project.end_date ? new Date(project.end_date) : undefined}
          actualRevenue={totalRevenue}
          actualCosts={totalCosts}
          estimatedRevenue={estimatedRevenue}
          estimatedCosts={estimatedCosts}
          totalRevenueWithEstimates={totalRevenueWithEstimates}
          totalCostsWithEstimates={totalCostsWithEstimates}
          operatingExpenses={operatingExpenses}
          invoices={project.invoices as Invoice[]}
          bills={project.bills as Bill[]}
          estimates={project.estimates || []}
        />
      </div>
    </div>
  );
}