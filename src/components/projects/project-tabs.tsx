'use client';

import { useState } from 'react';
import { ProjectInvoices } from './project-invoices';
import { ProjectBills } from './project-bills';
import { ProjectEstimates } from './project-estimates';
import { Invoice, Bill, ProjectEstimate } from '@/types';

interface ProjectTabsProps {
  projectId: string;
  invoices: Invoice[];
  bills: Bill[];
  estimates: ProjectEstimate[];
  initialEstimateFormOpen?: boolean;
  onEstimateFormClose?: () => void;
}

export function ProjectTabs({
  projectId,
  invoices,
  bills,
  estimates,
  initialEstimateFormOpen,
  onEstimateFormClose,
}: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'bills' | 'estimates'>('estimates');

  return (
    <div className="dashboard-card">
      <div className="tabs-header">
        <button
          className={`tab-button ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices ({invoices.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'bills' ? 'active' : ''}`}
          onClick={() => setActiveTab('bills')}
        >
          Bills ({bills.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'estimates' ? 'active' : ''}`}
          onClick={() => setActiveTab('estimates')}
        >
          Estimates ({estimates.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'invoices' && <ProjectInvoices invoices={invoices} />}
        {activeTab === 'bills' && <ProjectBills bills={bills} />}
        {activeTab === 'estimates' && (
          <ProjectEstimates
            projectId={projectId}
            estimates={estimates}
            initialFormOpen={initialEstimateFormOpen}
            onFormClose={onEstimateFormClose}
          />
        )}
      </div>
    </div>
  );
}