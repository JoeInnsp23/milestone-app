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
}

export function ProjectTabs({
  projectId,
  invoices,
  bills,
  estimates,
}: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'bills' | 'estimates'>('estimates');

  return (
    <div className="project-tabs">
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
        {activeTab === 'estimates' && <ProjectEstimates projectId={projectId} estimates={estimates} />}
      </div>

      <style jsx>{`
        .project-tabs {
          margin: 30px 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tabs-header {
          display: flex;
          border-bottom: 2px solid var(--border-color);
          padding: 0 20px;
        }

        .tab-button {
          padding: 16px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          margin-bottom: -2px;
        }

        .tab-button:hover {
          color: var(--primary);
        }

        .tab-button.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .tab-content {
          padding: 24px;
        }
      `}</style>
    </div>
  );
}