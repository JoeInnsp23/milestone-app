'use client';

import Link from 'next/link';
import { useTheme } from '@/components/theme-provider';
import { UserButton } from '@clerk/nextjs';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
            data-state={view === 'projects' ? 'active' : undefined}
          >
            <Link href="/projects">All Projects</Link>
          </Button>
          <Button
            type="button"
            onClick={toggleTheme}
            variant="header"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <UserButton />
        </div>
      </div>
    </div>
  );
}
