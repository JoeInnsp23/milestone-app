import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProjectById } from '@/lib/queries';
import { ProjectKPICards } from '@/components/projects/project-kpi-cards';
import { ProjectFinancialBreakdown } from '@/components/projects/project-financial-breakdown';
import { ProjectTabs } from '@/components/projects/project-tabs';
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

  const grossProfit = totalRevenue - (totalCosts * 0.6); // 60% as cost of sales
  const operatingExpenses = totalCosts * 0.4; // 40% as operating expenses
  const netProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return (
    <div className="min-h-screen dashboard-bg-gradient">
      <div className="container">
        {/* Header Card with Back Button */}
        <div className="header-card">
          <Link href="/projects" className="inline-block mb-4">
            <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              ← Back to All Projects
            </button>
          </Link>
          <h1>{project.name}</h1>
          <div className="subtitle">
            {project.client_name || 'No Client'} -
            {project.start_date && project.end_date ?
              ` ${new Date(project.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} to ${new Date(project.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}` :
              ' Date Range Not Set'}
          </div>
        </div>

        {/* KPI Cards */}
        <ProjectKPICards
          totalIncome={totalRevenue}
          grossProfit={grossProfit}
          netProfit={netProfit}
          profitMargin={profitMargin}
        />

        {/* Financial Breakdown */}
        <ProjectFinancialBreakdown
          revenue={totalRevenue}
          costOfSales={totalCosts * 0.6}
          operatingExpenses={operatingExpenses}
          invoices={project.invoices as Invoice[]}
          bills={project.bills as Bill[]}
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
  );
}