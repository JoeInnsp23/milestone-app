'use client';

import { useState, useMemo } from 'react';
import { ProjectSummary } from '@/types';
import { ProjectsFilter, FilterState } from '@/components/projects/projects-filter';
import { ProjectsTable } from '@/components/dashboard/projects-table';

interface ProjectsPageClientProps {
  projects: ProjectSummary[];
}

export function ProjectsPageClient({ projects }: ProjectsPageClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
  });

  // Helper function to get latest activity date from a project
  const getLatestActivity = (project: ProjectSummary): Date => {
    // Get all dates from invoices and bills
    const dates: Date[] = [];

    // Add invoice dates if available
    if (project.latest_invoice_date) {
      dates.push(new Date(project.latest_invoice_date));
    }

    // Add bill dates if available
    if (project.latest_bill_date) {
      dates.push(new Date(project.latest_bill_date));
    }

    // If no dates, use a very old date
    if (dates.length === 0) {
      return new Date('1900-01-01');
    }

    // Return the most recent date
    return new Date(Math.max(...dates.map(d => d.getTime())));
  };

  // Sort projects by latest activity (most recent first) as default
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      // Sort by latest activity - most recent first
      const aDate = getLatestActivity(a);
      const bDate = getLatestActivity(b);
      return bDate.getTime() - aDate.getTime();
    });
  }, [projects]);

  return (
    <>
      <ProjectsFilter onFilterChange={setFilters} />
      <ProjectsTable projects={sortedProjects} filters={filters} />
    </>
  );
}