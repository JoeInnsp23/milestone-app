'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProjectSummary } from '@/types';

interface ProjectsTableProps {
  projects: ProjectSummary[];
}

export function ProjectsTable({ projects: initialProjects }: ProjectsTableProps) {
  const [projects] = useState(initialProjects);

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

  const getProfitBarWidth = (profit: number) => {
    const absMaxProfit = Math.max(...projects.map(p => Math.abs(p.profit)));
    const percentage = (Math.abs(profit) / absMaxProfit) * 100;
    return Math.min(percentage, 100);
  };


  return (
    <div className="dashboard-card">
      <div className="chart-title" style={{ marginBottom: '20px' }}>
        All Projects Summary (Click project name for details)
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="dashboard-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{
                textAlign: 'left',
                padding: '12px',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                borderBottom: '2px solid var(--border-color)',
                background: 'var(--border-light)'
              }}>Project Name</th>
              <th style={{
                textAlign: 'right',
                padding: '12px',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                borderBottom: '2px solid var(--border-color)',
                background: 'var(--border-light)'
              }}>Revenue</th>
              <th style={{
                textAlign: 'right',
                padding: '12px',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                borderBottom: '2px solid var(--border-color)',
                background: 'var(--border-light)'
              }}>Cost of Sales</th>
              <th style={{
                textAlign: 'right',
                padding: '12px',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                borderBottom: '2px solid var(--border-color)',
                background: 'var(--border-light)'
              }}>Operating Exp.</th>
              <th style={{
                textAlign: 'right',
                padding: '12px',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                borderBottom: '2px solid var(--border-color)',
                background: 'var(--border-light)'
              }}>Net Profit</th>
              <th style={{
                textAlign: 'right',
                padding: '12px',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                borderBottom: '2px solid var(--border-color)',
                background: 'var(--border-light)'
              }}>Margin %</th>
              <th style={{
                textAlign: 'center',
                padding: '12px',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase',
                borderBottom: '2px solid var(--border-color)',
                background: 'var(--border-light)',
                width: '200px'
              }}>Visual</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={7} style={{
                  padding: '48px',
                  textAlign: 'center',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  No projects found.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr
                  key={project.project_id}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
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
                      style={{ width: `${getProfitBarWidth(project.profit)}px` }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}