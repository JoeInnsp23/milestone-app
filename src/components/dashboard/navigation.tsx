'use client';

import Link from 'next/link';
import { useTheme } from '@/components/theme-provider';
import { UserButton } from '@clerk/nextjs';
import { Moon, Sun } from 'lucide-react';

interface NavigationProps {
  view: string;
}

export function Navigation({ view }: NavigationProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="nav-bar">
      <div className="nav-content">
        <div className="nav-title">Project Hub</div>
        <div className="nav-buttons">
          <Link href="/dashboard?view=overview">
            <button className={`nav-btn ${view === 'overview' ? 'active' : ''}`}>
              Overview
            </button>
          </Link>
          <Link href="/dashboard?view=all">
            <button className={`nav-btn ${view === 'all' ? 'active' : ''}`}>
              All Projects
            </button>
          </Link>
          <button
            onClick={toggleTheme}
            className="nav-btn"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <UserButton />
        </div>
      </div>
    </div>
  );
}