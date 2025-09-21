'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ProjectHeaderClient } from '@/components/projects/project-header-client';
import { ProjectKPISection } from '@/components/projects/project-kpi-section';
import { ProjectFinancialBreakdown } from '@/components/projects/project-financial-breakdown';
import { ProjectTabsEnhanced } from '@/components/projects/project-tabs-enhanced';
import { PhaseSummaryCards } from '@/components/projects/phase-summary-cards';
import { FloatSummaryCard } from '@/components/projects/float-summary-card';
import { ProjectEstimatesHandle } from '@/components/projects/project-estimates';
import { Invoice, Bill, ProjectEstimate, PhaseSummary, BuildPhase, Project } from '@/types';

interface ProjectDetailClientProps {
  projectId: string;
  projectName: string;
  clientName?: string;
  startDate?: Date;
  endDate?: Date;
  actualRevenue: number;
  actualCosts: number;
  estimatedRevenue: number;
  estimatedCosts: number;
  totalRevenueWithEstimates: number;
  totalCostsWithEstimates: number;
  operatingExpenses: number;
  invoices: Invoice[];
  bills: Bill[];
  estimates: ProjectEstimate[];
  phaseSummaries: any[];
  allPhases: any[];
  allProjects: any[];
  floatReceived: number;
  totalCostsPaid: number;
}

export function ProjectDetailClient({
  projectId,
  projectName,
  clientName,
  startDate,
  endDate,
  actualRevenue,
  actualCosts,
  estimatedRevenue,
  estimatedCosts,
  totalRevenueWithEstimates,
  totalCostsWithEstimates,
  operatingExpenses,
  invoices,
  bills,
  estimates,
  phaseSummaries,
  allPhases,
  allProjects,
  floatReceived,
  totalCostsPaid,
}: ProjectDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'bills' | 'estimates'>('estimates');
  const [pendingOpen, setPendingOpen] = useState(false);
  const estimatesRef = useRef<ProjectEstimatesHandle>(null);

  const scheduleModalOpen = useCallback((onAfter?: () => void) => {
    const trigger = () => {
      estimatesRef.current?.openCreateModal();
      onAfter?.();
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(trigger);
    } else {
      setTimeout(trigger, 0);
    }
  }, []);

  const handleAddEstimate = useCallback(() => {
    if (activeTab !== 'estimates') {
      setActiveTab('estimates');
      setPendingOpen(true);
      return;
    }

    scheduleModalOpen();
  }, [activeTab, scheduleModalOpen]);

  useEffect(() => {
    if (!pendingOpen || activeTab !== 'estimates') {
      return;
    }

    scheduleModalOpen(() => setPendingOpen(false));
  }, [activeTab, pendingOpen, scheduleModalOpen]);

  return (
    <>
      {/* Client-Side Header with Interactive Elements */}
      <ProjectHeaderClient
        projectId={projectId}
        projectName={projectName}
        clientName={clientName}
        startDate={startDate}
        endDate={endDate}
        onAddEstimate={handleAddEstimate}
      />

      {/* Main content with consistent spacing */}
      <div className="space-y-6">
        {/* Phase Summary Cards */}
        {phaseSummaries.length > 0 && (
          <PhaseSummaryCards
            phases={phaseSummaries}
          />
        )}

        {/* Float Summary Card and KPI Cards */}
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <FloatSummaryCard
              floatReceived={floatReceived}
              totalCostsPaid={totalCostsPaid}
              projectId={projectId}
            />
          </div>
          <div className="lg:col-span-3">
            <ProjectKPISection
              actualRevenue={actualRevenue}
              actualCosts={actualCosts}
              estimatedRevenue={estimatedRevenue}
              estimatedCosts={estimatedCosts}
            />
          </div>
        </div>

        {/* Financial Breakdown - Including Estimates */}
        <ProjectFinancialBreakdown
          revenue={totalRevenueWithEstimates}
          costOfSales={totalCostsWithEstimates * 0.6}
          operatingExpenses={operatingExpenses}
          invoices={invoices}
        />

        {/* Enhanced Tabs with Phase Grouping */}
        <ProjectTabsEnhanced
          projectId={projectId}
          invoices={invoices}
          bills={bills}
          estimates={estimates}
          phases={allPhases}
          projects={allProjects}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          estimatesRef={estimatesRef}
        />
      </div>
    </>
  );
}
