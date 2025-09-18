'use client';

import { useState } from 'react';
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

  return (
    <>
      <ProjectsFilter onFilterChange={setFilters} />
      <ProjectsTable projects={projects} filters={filters} />
    </>
  );
}