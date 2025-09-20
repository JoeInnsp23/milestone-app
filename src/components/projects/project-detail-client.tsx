'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ProjectHeaderClient } from '@/components/projects/project-header-client';
import { ProjectKPISection } from '@/components/projects/project-kpi-section';
import { ProjectFinancialBreakdown } from '@/components/projects/project-financial-breakdown';
import { ProjectTabs } from '@/components/projects/project-tabs';
import { ProjectEstimatesHandle } from '@/components/projects/project-estimates';
import { Invoice, Bill, ProjectEstimate } from '@/types';

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
        {/* KPI Cards with Estimates Toggle */}
        <ProjectKPISection
          actualRevenue={actualRevenue}
          actualCosts={actualCosts}
          estimatedRevenue={estimatedRevenue}
          estimatedCosts={estimatedCosts}
        />

        {/* Financial Breakdown - Including Estimates */}
        <ProjectFinancialBreakdown
          revenue={totalRevenueWithEstimates}
          costOfSales={totalCostsWithEstimates * 0.6}
          operatingExpenses={operatingExpenses}
          invoices={invoices}
        />

        {/* Tabs for Invoices, Bills, and Estimates */}
        <ProjectTabs
          projectId={projectId}
          invoices={invoices}
          bills={bills}
          estimates={estimates}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          estimatesRef={estimatesRef}
        />
      </div>
    </>
  );
}
