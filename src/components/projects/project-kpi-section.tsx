'use client';

import { ProjectFinancialSummaryCard } from './project-financial-summary-card';

interface ProjectKPISectionProps {
  actualRevenue: number;
  actualCosts: number;
  estimatedRevenue: number;
  estimatedCosts: number;
}

export function ProjectKPISection({
  actualRevenue,
  actualCosts,
  estimatedRevenue,
  estimatedCosts,
}: ProjectKPISectionProps) {
  return (
    <ProjectFinancialSummaryCard
      actualRevenue={actualRevenue}
      actualCosts={actualCosts}
      estimatedRevenue={estimatedRevenue}
      estimatedCosts={estimatedCosts}
    />
  );
}