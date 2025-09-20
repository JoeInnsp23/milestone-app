'use client';

import React from 'react';
import Link from 'next/link';
import { ExportDialog } from '@/components/export/export-dialog';

interface ProjectHeaderClientProps {
  projectId: string;
  projectName: string;
  clientName?: string;
  startDate?: Date;
  endDate?: Date;
}

export function ProjectHeaderClient({
  projectId,
  projectName,
  clientName,
  startDate,
  endDate,
}: ProjectHeaderClientProps) {
  const handleOpenEstimateForm = () => {
    // Dispatch custom event for ProjectEstimates component
    const event = new CustomEvent('open-estimate-form');
    window.dispatchEvent(event);
  };

  const formatDate = (date?: Date) => {
    if (!date) return null;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Header Card */}
      <div className="header-card">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1>{projectName}</h1>
            <div className="subtitle">
              {clientName || 'No Client'} -{' '}
              {startDate && endDate
                ? `${formatDate(startDate)} to ${formatDate(endDate)}`
                : ' Date Range Not Set'}
            </div>
          </div>
          <div className="flex gap-3">
            <ExportDialog projectId={projectId} />
            <button
              onClick={handleOpenEstimateForm}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              + Add Estimate
            </button>
          </div>
        </div>
      </div>

      {/* Back Button - Outside header card */}
      <Link href="/projects" className="inline-block mb-4">
        <button className="text-sm text-white/80 hover:text-white transition-colors">
          ← Back to All Projects
        </button>
      </Link>
    </>
  );
}