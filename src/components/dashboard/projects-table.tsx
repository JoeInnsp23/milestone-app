'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ProjectSummary } from '@/types';
import { FilterState } from '@/components/projects/projects-filter';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface ProjectsTableProps {
  projects: ProjectSummary[];
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  isLoading?: boolean;
}

type SortKey = 'project_name' | 'actual_revenue' | 'actual_costs' | 'operating_expenses' | 'profit' | 'profit_margin';
type SortDirection = 'asc' | 'desc';

export function ProjectsTable({ projects: initialProjects, filters, onFilterChange, isLoading }: ProjectsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Local filter state for debouncing
  const [localFilters, setLocalFilters] = useState<FilterState>({
    search: '',
    status: 'all',
  });

  // Sync with incoming filters
  useEffect(() => {
    if (filters) {
      setLocalFilters(filters);
    }
  }, [filters]);

  // Debounced filter updates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFilterChange) {
        onFilterChange(localFilters);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localFilters, onFilterChange]);

  // Check if filters are active
  const hasActiveFilters = localFilters.search !== '' || localFilters.status !== 'all';

  // Filter handlers
  const handleSearchChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, search: value }));
  };

  const handleStatusChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, status: value }));
  };

  const clearFilters = () => {
    setLocalFilters({
      search: '',
      status: 'all',
    });
  };

  const clearSort = useCallback(() => {
    setSortKey(null);
    setSortDirection('asc');
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getProfitBarWidth = (profit: number, projects: ProjectSummary[]) => {
    const absMaxProfit = Math.max(...projects.map(p => Math.abs(p.profit)));
    const percentage = (Math.abs(profit) / absMaxProfit) * 100;
    return Math.min(percentage, 100);
  };

  // Filter projects based on filters
  const filteredProjects = useMemo(() => {
    let filtered = [...initialProjects];

    if (filters) {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(p =>
          p.project_name.toLowerCase().includes(searchTerm) ||
          (p.client_name && p.client_name.toLowerCase().includes(searchTerm))
        );
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter(p => p.project_status === filters.status);
      }

      // Date range filter would need project dates in the data
      // For now, this is a placeholder
    }

    return filtered;
  }, [initialProjects, filters]);

  // Sort projects
  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjects];

    // If no sort key is set, return unsorted (preserves default order)
    if (!sortKey) return sorted;

    sorted.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortKey) {
        case 'project_name':
          aValue = a.project_name.toLowerCase();
          bValue = b.project_name.toLowerCase();
          break;
        case 'actual_revenue':
          aValue = a.actual_revenue;
          bValue = b.actual_revenue;
          break;
        case 'actual_costs':
          aValue = a.actual_costs;
          bValue = b.actual_costs;
          break;
        case 'operating_expenses':
          // Assuming operating expenses is 40% of costs (as per dashboard calculation)
          aValue = a.actual_costs * 0.4;
          bValue = b.actual_costs * 0.4;
          break;
        case 'profit':
          aValue = a.profit;
          bValue = b.profit;
          break;
        case 'profit_margin':
          aValue = a.profit_margin;
          bValue = b.profit_margin;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredProjects, sortKey, sortDirection]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }, [sortKey]);

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <span className="sort-icon">↕</span>;
    }
    return sortDirection === 'asc' ?
      <span className="sort-icon active">↑</span> :
      <span className="sort-icon active">↓</span>;
  };

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="chart-title" style={{ marginBottom: '20px' }}>
          Loading projects...
        </div>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-2"></div>
          <div className="h-10 bg-gray-200 rounded mb-2"></div>
          <div className="h-10 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <div className="chart-title" style={{ marginBottom: '16px' }}>
        All Projects Summary (Click project name for details)
        {filteredProjects.length < initialProjects.length && (
          <span className="text-sm text-gray-500 ml-2">
            (Showing {filteredProjects.length} of {initialProjects.length} projects)
          </span>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-wrap gap-3 mb-6" style={{ marginBottom: '24px' }}>
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by project or client name..."
              value={localFilters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                padding: '8px',
                border: '1px solid hsl(var(--border))',
                borderRadius: '4px',
                fontSize: '14px',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
                paddingLeft: '40px'
              }}
            />
          </div>
        </div>

        <div className="w-[180px]">
          <Select value={localFilters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="bg-[var(--nav-btn-bg)] text-white rounded-lg shadow transition-transform hover:bg-[var(--nav-btn-hover)] hover:-translate-y-0.5">
              <SelectValue placeholder="All Status" className="text-white" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--nav-btn-bg)] rounded-lg shadow border border-[var(--nav-btn-hover)]">
              <SelectItem value="all" className="text-white hover:bg-[var(--nav-btn-hover)] focus:bg-[var(--nav-btn-hover)] data-[state=checked]:bg-[var(--nav-btn-active)]">All Status</SelectItem>
              <SelectItem value="Active" className="text-white hover:bg-[var(--nav-btn-hover)] focus:bg-[var(--nav-btn-hover)] data-[state=checked]:bg-[var(--nav-btn-active)]">Active</SelectItem>
              <SelectItem value="Completed" className="text-white hover:bg-[var(--nav-btn-hover)] focus:bg-[var(--nav-btn-hover)] data-[state=checked]:bg-[var(--nav-btn-active)]">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="header"
          size="default"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>

        {sortKey && (
          <Button variant="header" size="default" onClick={clearSort}>
            <X className="mr-2 h-4 w-4" />
            Clear Sort
          </Button>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="dashboard-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                onClick={() => handleSort('project_name')}
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  borderBottom: '2px solid var(--border-color)',
                  background: 'var(--border-light)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Project Name {getSortIcon('project_name')}
              </th>
              <th
                onClick={() => handleSort('actual_revenue')}
                style={{
                  textAlign: 'right',
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  borderBottom: '2px solid var(--border-color)',
                  background: 'var(--border-light)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Revenue {getSortIcon('actual_revenue')}
              </th>
              <th
                onClick={() => handleSort('actual_costs')}
                style={{
                  textAlign: 'right',
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  borderBottom: '2px solid var(--border-color)',
                  background: 'var(--border-light)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Cost of Sales {getSortIcon('actual_costs')}
              </th>
              <th
                onClick={() => handleSort('operating_expenses')}
                style={{
                  textAlign: 'right',
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  borderBottom: '2px solid var(--border-color)',
                  background: 'var(--border-light)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Operating Exp. {getSortIcon('operating_expenses')}
              </th>
              <th
                onClick={() => handleSort('profit')}
                style={{
                  textAlign: 'right',
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  borderBottom: '2px solid var(--border-color)',
                  background: 'var(--border-light)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Net Profit {getSortIcon('profit')}
              </th>
              <th
                onClick={() => handleSort('profit_margin')}
                style={{
                  textAlign: 'right',
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  borderBottom: '2px solid var(--border-color)',
                  background: 'var(--border-light)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Margin % {getSortIcon('profit_margin')}
              </th>
              <th style={{
                textAlign: 'center',
                padding: '12px',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                borderBottom: '2px solid var(--border-color)',
                background: 'var(--border-light)',
                width: '200px'
              }}>
                Visual
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProjects.length === 0 ? (
              <tr>
                <td colSpan={7} style={{
                  padding: '48px',
                  textAlign: 'center',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  {filteredProjects.length === 0 && initialProjects.length > 0
                    ? 'No projects match your filters.'
                    : 'No projects found.'}
                </td>
              </tr>
            ) : (
              sortedProjects.map((project) => (
                <tr
                  key={project.project_id}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <td style={{ padding: '12px' }}>
                    <Link
                      href={`/projects/${project.project_id}`}
                      style={{
                        color: 'var(--link-color)',
                        textDecoration: 'none',
                        fontWeight: 'bold'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      {project.project_name}
                    </Link>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {formatCurrency(project.actual_revenue)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {formatCurrency(project.actual_costs * 0.6)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {formatCurrency(project.actual_costs * 0.4)}
                  </td>
                  <td style={{
                    padding: '12px',
                    textAlign: 'right',
                    color: project.profit >= 0 ? 'var(--positive)' : 'var(--negative)',
                    fontWeight: 'bold'
                  }}>
                    {formatCurrency(project.profit)}
                  </td>
                  <td style={{
                    padding: '12px',
                    textAlign: 'right',
                    color: project.profit_margin >= 0 ? 'var(--positive)' : 'var(--negative)'
                  }}>
                    {formatPercent(project.profit_margin)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span
                      className={`profit-bar ${project.profit >= 0 ? 'positive' : 'negative'}`}
                      style={{ width: `${getProfitBarWidth(project.profit, sortedProjects)}px` }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .sort-icon {
          display: inline-block;
          margin-left: 4px;
          opacity: 0.5;
          transition: opacity 0.2s;
        }
        .sort-icon.active {
          opacity: 1;
          color: var(--primary);
        }

        :global(html.dark) input[type="text"] {
          background: hsl(220 32% 12%) !important;
          border-color: hsl(220 20% 24%) !important;
        }
      `}</style>
    </div>
  );
}