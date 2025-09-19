'use client';

import { useState } from 'react';
import { ProjectKPICards } from './project-kpi-cards';

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
  const [includeEstimates, setIncludeEstimates] = useState(true);

  return (
    <>
      {/* Toggle Switch */}
      <div className="flex items-center justify-end mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-muted-foreground">Include Estimates</span>
          <input
            type="checkbox"
            checked={includeEstimates}
            onChange={(e) => setIncludeEstimates(e.target.checked)}
            className="estimates-toggle"
          />
        </label>
      </div>

      {/* KPI Cards */}
      <ProjectKPICards
        actualRevenue={actualRevenue}
        actualCosts={actualCosts}
        estimatedRevenue={estimatedRevenue}
        estimatedCosts={estimatedCosts}
        includeEstimates={includeEstimates}
      />
    </>
  );
}