'use client';

import { Ref, useState } from 'react';
import { ProjectInvoices } from './project-invoices';
import { ProjectBills } from './project-bills';
import { ProjectEstimates, ProjectEstimatesHandle } from './project-estimates';
import { Invoice, Bill, ProjectEstimate } from '@/types';

interface ProjectTabsProps {
  projectId: string;
  invoices: Invoice[];
  bills: Bill[];
  estimates: ProjectEstimate[];
  activeTab?: 'invoices' | 'bills' | 'estimates';
  onTabChange?: (tab: 'invoices' | 'bills' | 'estimates') => void;
  estimatesRef?: Ref<ProjectEstimatesHandle>;
}

export function ProjectTabs({
  projectId,
  invoices,
  bills,
  estimates,
  activeTab,
  onTabChange,
  estimatesRef,
}: ProjectTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<'invoices' | 'bills' | 'estimates'>('estimates');
  const currentTab = activeTab ?? internalActiveTab;

  const handleTabChange = (tab: 'invoices' | 'bills' | 'estimates') => {
    if (tab === currentTab) return;

    if (onTabChange) {
      onTabChange(tab);
    }

    if (activeTab === undefined) {
      setInternalActiveTab(tab);
    }
  };
  return (
    <div className="dashboard-card">
      <div className="tabs-header">
        <button
          className={`tab-button ${currentTab === 'invoices' ? 'active' : ''}`}
          onClick={() => handleTabChange('invoices')}
        >
          Invoices ({invoices.length})
        </button>
        <button
          className={`tab-button ${currentTab === 'bills' ? 'active' : ''}`}
          onClick={() => handleTabChange('bills')}
        >
          Bills ({bills.length})
        </button>
        <button
          className={`tab-button ${currentTab === 'estimates' ? 'active' : ''}`}
          onClick={() => handleTabChange('estimates')}
        >
          Estimates ({estimates.length})
        </button>
      </div>

      <div className="tab-content">
        {currentTab === 'invoices' && <ProjectInvoices invoices={invoices} />}
        {currentTab === 'bills' && <ProjectBills bills={bills} />}
        {currentTab === 'estimates' && (
          <ProjectEstimates
            ref={estimatesRef}
            projectId={projectId}
            estimates={estimates}
          />
        )}
      </div>
    </div>
  );
}
