'use client';

import React from 'react';
import Link from 'next/link';
import { ExportDialog } from '@/components/export/export-dialog';
import { Button } from '@/components/ui/button';

interface ProjectHeaderClientProps {
  projectId: string;
  projectName: string;
  clientName?: string;
  startDate?: Date;
  endDate?: Date;
  onAddEstimate: () => void;
}

export function ProjectHeaderClient({
  projectId,
  projectName,
  clientName,
  startDate,
  endDate,
  onAddEstimate,
}: ProjectHeaderClientProps) {

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
      {/* Back Button - Above header card */}
      <Link href="/projects" className="inline-block mb-4">
        <button className="text-sm text-white/80 hover:text-white transition-colors">
          ← Back to All Projects
        </button>
      </Link>

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
          <div className="flex flex-col gap-2">
            <ExportDialog projectId={projectId} />
            <Button onClick={onAddEstimate} variant="header">
              + Add Estimate
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
