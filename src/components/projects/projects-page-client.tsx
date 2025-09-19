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
    dateFrom: '',
    dateTo: '',
  });

  // Sort projects by latest activity by default
  const sortedProjects = useMemo(() => {
    const getLatestActivity = (project: ProjectSummary) => {
      // For now, we'll use the project name as a fallback
      // In a real implementation, we'd have invoice/bill dates
      return 0;
    };

    return [...projects].sort((a, b) => {
      // Default sort by project name for now
      // This would be replaced with actual activity date sorting
      return a.project_name.localeCompare(b.project_name);
    });
  }, [projects]);

  return (
    <>
      <ProjectsFilter onFilterChange={setFilters} />
      <ProjectsTable projects={sortedProjects} filters={filters} defaultSortKey="latest_activity" />
    </>
  );
}