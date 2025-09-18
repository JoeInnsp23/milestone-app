'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ThemeToggle } from '@/components/theme-provider';

interface DashboardHeaderProps {
  stats: {
    company_name?: string;
    date_from?: Date | string;
    date_to?: Date | string;
  };
  view: string;
}

export function DashboardHeader({ stats, view }: DashboardHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-card shadow-lg">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Projects P&L Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {String(stats.company_name || 'Build By Milestone Ltd')} -{' '}
              {stats.date_from
                ? format(new Date(String(stats.date_from)), 'd MMMM yyyy')
                : '1 January 2024'}{' '}
              to{' '}
              {stats.date_to
                ? format(new Date(String(stats.date_to)), 'd MMMM yyyy')
                : '31 December 2024'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <Link href="/dashboard?view=overview">
                <button
                  className={`nav-button ${view === 'overview' ? 'active' : ''}`}
                >
                  Overview
                </button>
              </Link>
              <Link href="/dashboard?view=all">
                <button
                  className={`nav-button ${view === 'all' ? 'active' : ''}`}
                >
                  All Projects
                </button>
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}