'use client';

import { useState, useMemo } from 'react';
import { ProjectSummary } from '@/types';
import { ProjectsFilter, FilterState } from '@/components/projects/projects-filter';
import { ProjectsTable } from '@/components/dashboard/projects-table';
import { useProjectCountValidation } from '@/hooks/useDataValidation';

interface ProjectsPageClientProps {
  projects: ProjectSummary[];
}

export function ProjectsPageClient({ projects }: ProjectsPageClientProps) {
  // Run validation in development
  useProjectCountValidation();

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
  });

  // Sort projects by profit (descending) as default
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      // Sort by profit descending as a more useful default
      // Projects with higher profit appear first
      return b.profit - a.profit;
    });
  }, [projects]);

  return (
    <>
      <ProjectsFilter onFilterChange={setFilters} />
      <ProjectsTable projects={sortedProjects} filters={filters} defaultSortKey="latest_activity" />
    </>
  );
}