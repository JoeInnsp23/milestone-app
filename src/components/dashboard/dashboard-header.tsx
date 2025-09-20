'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ThemeToggle } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

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
              {String(stats.company_name || 'Build By Milestone Ltd')} Dashboard
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
              <Button
                asChild
                variant="header"
                data-state={view === 'overview' ? 'active' : undefined}
              >
                <Link href="/dashboard?view=overview">Overview</Link>
              </Button>
              <Button
                asChild
                variant="header"
                data-state={view === 'all' ? 'active' : undefined}
              >
                <Link href="/dashboard?view=all">All Projects</Link>
              </Button>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
