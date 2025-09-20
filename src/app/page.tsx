'use client';

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useTheme } from '@/components/theme-provider';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen dashboard-bg-gradient">
      {/* Navigation Bar - Matching Dashboard */}
      <div className="nav-bar">
        <div className="nav-content">
          <div className="nav-title">Project Hub</div>
          <div className="nav-buttons">
            <SignedOut>
              <Button asChild variant="header">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </SignedOut>
            <Button
              type="button"
              onClick={toggleTheme}
              variant="header"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        {/* Call to Action Section - Now at the top as hero */}
        <div className="header-card" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '15px', color: 'var(--foreground)', fontWeight: 'bold' }}>
            Transform Your Project Management
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '18px' }}>
            Professional P&L dashboard for construction and service companies.
            Track profitability, monitor costs, and make data-driven decisions.
          </p>
          <SignedOut>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <Button asChild variant="header" size="lg" data-state="active" className="text-base px-7 py-3">
                <Link href="/sign-in">Access Dashboard</Link>
              </Button>
              <Button variant="header" size="lg" className="text-base px-7 py-3">
                Request Demo
              </Button>
            </div>
            <p style={{ color: 'var(--text-dim)', marginTop: '20px', fontSize: '14px' }}>
              Contact your administrator for access credentials
            </p>
          </SignedOut>
          <SignedIn>
            <Button asChild variant="header" size="lg" data-state="active" className="text-base px-10 py-3">
              <Link href="/dashboard">Open Dashboard</Link>
            </Button>
          </SignedIn>
        </div>

        {/* Features Section - Professional Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="chart-title">Real-Time Analytics</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
              Live project performance metrics synchronized with your accounting system for accurate, up-to-date financial insights.
              Monitor revenue, costs, and profitability in real-time.
            </p>
            <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', marginBottom: '0' }}>
              <li>Automatic data synchronization</li>
              <li>Real-time updates</li>
              <li>Historical trend analysis</li>
            </ul>
          </div>

          <div className="stat-card">
            <div className="chart-title">Comprehensive Reporting</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
              Generate detailed P&L reports by project, phase, or time period.
              Export data in multiple formats for stakeholder presentations.
            </p>
            <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', marginBottom: '0' }}>
              <li>PDF & Excel exports</li>
              <li>Customizable date ranges</li>
              <li>Drill-down capabilities</li>
            </ul>
          </div>

          <div className="stat-card">
            <div className="chart-title">Project Performance Tracking</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
              Track individual project profitability with detailed breakdowns of revenue,
              costs, and margins. Identify profitable projects and optimization opportunities.
            </p>
            <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', marginBottom: '0' }}>
              <li>Project-level P&L analysis</li>
              <li>Cost breakdown by category</li>
              <li>Margin trend tracking</li>
            </ul>
          </div>

          <div className="stat-card">
            <div className="chart-title">Enterprise Security</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
              Bank-grade security with enterprise authentication, ensuring your financial data
              is protected. Role-based access control for team collaboration.
            </p>
            <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', marginBottom: '0' }}>
              <li>Secure authentication</li>
              <li>Encrypted data storage</li>
              <li>Audit trail logging</li>
            </ul>
          </div>
        </div>

        {/* Professional Footer */}
        <div style={{
          marginTop: '60px',
          padding: '30px 0',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            © 2024 Project Hub. All rights reserved.
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '10px' }}>
            Secure cloud infrastructure • Real-time data synchronization • Enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
}
