# Phase 4: Dashboard Implementation

## Overview
This phase builds the main dashboard with Server Components for direct database queries, KPI cards, Recharts visualizations, and a projects table. The UI design follows the existing MVP dashboard shown in `.reference/Screenshot*.png` files.

## UI Reference from Existing MVP
The dashboard must match the existing MVP design:
- **Layout**: Blue gradient background with white cards (see `.reference/Screenshot 2025-09-17 at 10.23.58.png`)
- **Header**: "Projects P&L Dashboard" with date range subtitle
- **KPI Cards**: 4 cards showing Total Projects, Total Revenue, Net Profit, Profitable Projects
- **Charts**: Bar chart for "Top 10 Projects by Net Profit" and donut chart for "Revenue Breakdown"
- **Projects Table**: Clickable rows with columns for Project Name, Revenue, Cost of Sales, Operating Exp., Net Profit, Margin %, Visual indicator
- **Color Scheme**: Green for positive values (#10b981), red for negative values (#ef4444)
- **Toggle**: "Overview" and "All Projects" navigation buttons

## Prerequisites
- Phases 1-3 completed successfully
- Database populated with data (either from n8n sync or seed data)
- Authentication working

## Step 1: Install Additional Dependencies

### 1.1 Install Recharts and Utilities

```bash
npm install recharts date-fns
npm install @tanstack/react-table
```

## Step 2: Create Dashboard Stats Components

### 2.1 Create Stats Card Component

Create `src/components/stats-cards.tsx` (matching MVP design from `.reference/Screenshot*.png`):

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  isProfit?: boolean
  className?: string
}

// Matching the MVP's KPI card design from .reference/Screenshot 2025-09-17 at 10.23.58.png
export function StatsCard({
  title,
  value,
  isProfit = false,
  className
}: StatsCardProps) {
  return (
    <Card className={cn(
      "bg-card/95 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-shadow",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-3xl font-bold",
          isProfit && "text-positive" // Using MVP's green color for profit
        )}>
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardStatsProps {
  stats: {
    totalRevenue: number
    totalCosts: number
    totalProfit: number
    profitMargin: number
    activeProjects: number
    pendingInvoices: number
    overdueInvoices: number
  }
}

// Simplified component matching MVP - no SecondaryStats needed
```

## Step 3: Create Chart Components

### 3.1 Create Revenue Chart Component

Create `src/components/revenue-chart.tsx`:

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { format } from 'date-fns'

interface RevenueData {
  month: string
  revenue: number
  costs: number
  profit: number
}

interface RevenueChartProps {
  data: RevenueData[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Month
              </span>
              <span className="font-bold text-muted-foreground">
                {label}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Revenue
              </span>
              <span className="font-bold">
                {formatCurrency(payload[0].value)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Costs
              </span>
              <span className="font-bold">
                {formatCurrency(payload[1].value)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Profit
              </span>
              <span className="font-bold">
                {formatCurrency(payload[2].value)}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="costs"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorCosts)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorProfit)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

### 3.2 Create Profit Chart Component

Create `src/components/profit-chart.tsx`:

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts'

interface ProfitData {
  name: string
  profit: number
  margin: number
}

interface ProfitChartProps {
  data: ProfitData[]
}

export function ProfitChart({ data }: ProfitChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getBarColor = (profit: number) => {
    return profit >= 0 ? '#10b981' : '#ef4444'
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Project
            </span>
            <span className="font-bold text-muted-foreground">
              {label}
            </span>
          </div>
          <div className="mt-2 flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Profit
            </span>
            <span className="font-bold">
              {formatCurrency(payload[0].value)}
            </span>
          </div>
          <div className="mt-2 flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Margin
            </span>
            <span className="font-bold">
              {payload[0].payload.margin.toFixed(1)}%
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Project Profitability</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.profit)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

## Step 4: Create Projects Table Component

### 4.1 Create Table Component

Create `src/components/project-table.tsx`:

```typescript
'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowUpDown, Search, ExternalLink } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { ProjectSummary } from '@/types'

interface ProjectTableProps {
  projects: ProjectSummary[]
}

export function ProjectTable({ projects: initialProjects }: ProjectTableProps) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const [projects, setProjects] = useState(initialProjects)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ProjectSummary
    direction: 'asc' | 'desc'
  } | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const handleSort = (key: keyof ProjectSummary) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc'
    }
    setSortConfig({ key, direction })

    const sorted = [...projects].sort((a, b) => {
      const aValue = a[key]
      const bValue = b[key]

      if (aValue === null) return 1
      if (bValue === null) return -1
      if (aValue === bValue) return 0

      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setProjects(sorted)
  }

  const filteredProjects = projects.filter((project) =>
    project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getProfitStatusColor = (margin: number) => {
    if (margin >= 20) return 'bg-green-100 text-green-800'
    if (margin >= 10) return 'bg-blue-100 text-blue-800'
    if (margin >= 0) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Projects Overview</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('project_name')}
                    className="h-8 p-0"
                  >
                    Project
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('client_name')}
                    className="h-8 p-0"
                  >
                    Client
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('actual_revenue')}
                    className="h-8 p-0"
                  >
                    Revenue
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('actual_costs')}
                    className="h-8 p-0"
                  >
                    Costs
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('profit')}
                    className="h-8 p-0"
                  >
                    Profit
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('profit_margin')}
                    className="h-8 p-0"
                  >
                    Margin
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.project_id}>
                    <TableCell className="font-medium">
                      {project.project_name}
                    </TableCell>
                    <TableCell>{project.client_name || '-'}</TableCell>
                    <TableCell>{formatCurrency(project.actual_revenue)}</TableCell>
                    <TableCell>{formatCurrency(project.actual_costs)}</TableCell>
                    <TableCell>
                      <span className={project.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(project.profit)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getProfitStatusColor(project.profit_margin)}>
                        {formatPercent(project.profit_margin)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {project.project_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`${basePath}/projects/${project.project_id}`}>
                        <Button variant="ghost" size="sm">
                          View
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 4.2 Install Additional UI Components

```bash
npx shadcn@latest add badge
```

## Step 5: Update Dashboard Page with Real Data

### 5.1 Update Dashboard Page

Update `src/app/(protected)/dashboard/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { getDashboardStats, getProjectSummaries, getMonthlyRevenue } from '@/lib/queries'
import { StatsCard } from '@/components/stats-cards'
import { Button } from '@/components/ui/button'
import { RevenueChart } from '@/components/revenue-chart'
import { ProfitChart } from '@/components/profit-chart'
import { ProjectTable } from '@/components/project-table'
import { Card } from '@/components/ui/card'
import { format, subMonths, startOfMonth } from 'date-fns'

interface DashboardPageProps {
  searchParams: { view?: string }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const view = searchParams?.view || 'overview'
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  // Fetch data using Server Component
  const [stats, projectSummaries, monthlyData] = await Promise.all([
    getDashboardStats(),
    getProjectSummaries(),
    getMonthlyRevenue(6), // Get last 6 months of actual invoice/bill data
  ])

  // Group projects by project_id to get unique projects
  const uniqueProjects = projectSummaries.reduce((acc: any[], curr: any) => {
    const existing = acc.find(p => p.project_id === curr.project_id)
    if (!existing) {
      acc.push({
        ...curr,
        actual_revenue: projectSummaries
          .filter(p => p.project_id === curr.project_id)
          .reduce((sum, p) => sum + (p.actual_revenue || 0), 0),
        actual_costs: projectSummaries
          .filter(p => p.project_id === curr.project_id)
          .reduce((sum, p) => sum + (p.actual_costs || 0), 0),
        profit: projectSummaries
          .filter(p => p.project_id === curr.project_id)
          .reduce((sum, p) => sum + (p.profit || 0), 0),
      })
    }
    return acc
  }, [])

  uniqueProjects.forEach(project => {
    project.profit_margin = project.actual_revenue > 0
      ? ((project.profit / project.actual_revenue) * 100)
      : 0
  })

  // monthlyData now comes from actual invoice/bill dates via getMonthlyRevenue()
  const profitData = uniqueProjects
    .slice(0, 10)
    .map((project) => ({
      name: project.project_name.length > 20
        ? project.project_name.substring(0, 20) + '...'
        : project.project_name,
      profit: project.profit,
      margin: project.profit_margin,
    }))
    .sort((a, b) => b.profit - a.profit)

  const formattedStats = {
    totalRevenue: stats.total_revenue || 0,
    totalCosts: stats.total_costs || 0,
    totalProfit: stats.total_profit || 0,
    profitMargin: stats.profit_margin || 0,
    activeProjects: stats.active_projects || 0,
    profitableProjects: uniqueProjects.filter(p => p.profit > 0).length,
  }

  return (
    // Matching MVP layout - gradient only in header, white background for main content
    <div className="min-h-screen bg-background">
      <div className="gradient-bg-light dark:gradient-bg-dark pb-1">
        <div className="container mx-auto p-6">
          {/* Page Header matching MVP */}
          <div className="bg-card/95 backdrop-blur rounded-lg p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Projects P&L Dashboard</h1>
                <p className="text-white/80">
                  {stats.company_name || 'Build By Milestone Ltd'} - {format(stats.date_from || new Date(), 'dd MMMM yyyy')} to {format(stats.date_to || new Date(), 'dd MMMM yyyy')}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`${basePath}/dashboard?view=overview`}>
                  <Button
                    variant={view === 'overview' ? 'default' : 'outline'}
                    className={view === 'overview' ? 'bg-white text-primary hover:bg-white/90' : 'border-white text-white hover:bg-white/10'}
                  >
                    Overview
                  </Button>
                </Link>
                <Link href={`${basePath}/projects`}>
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                  >
                    All Projects
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area with white background */}
      <div className="container mx-auto p-6">

        {/* Show different content based on view */}
        {view === 'overview' ? (
          <>
            {/* KPI Cards matching MVP */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
          <StatsCard
            title="TOTAL PROJECTS"
            value={formattedStats.activeProjects}
          />
          <StatsCard
            title="TOTAL REVENUE"
            value={`£${formattedStats.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <StatsCard
            title="NET PROFIT"
            value={`£${formattedStats.totalProfit.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            isProfit={true}
          />
          <StatsCard
            title="PROFITABLE PROJECTS"
            value={`${formattedStats.profitableProjects} / ${formattedStats.activeProjects}`}
          />
            </div>

            {/* Charts matching MVP layout */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-card/95 backdrop-blur border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Top 10 Projects by Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfitChart data={profitData} />
            </CardContent>
          </Card>
          <Card className="bg-card/95 backdrop-blur border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={monthlyData} />
            </CardContent>
          </Card>
            </div>
          </>
        ) : (
          /* Projects Table View */
          <ProjectTable projects={uniqueProjects} />
        )}

        {/* Sync Status */}
        {stats.last_sync_time && (
          <Card className="mt-6 p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Data last synchronized from Xero</span>
              <span className="font-medium">
                {format(new Date(stats.last_sync_time), 'PPpp')}
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
```

## Step 6: Create Loading States

### 6.1 Create Dashboard Loading Component

Create `src/app/(protected)/dashboard/loading.tsx`:

```typescript
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-6">
      {/* Page Header */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-2 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
```

## Step 7: Create Error Boundary

### 7.1 Create Error Component

Create `src/app/(protected)/dashboard/error.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Something went wrong!</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We encountered an error while loading the dashboard. This might be
            because:
          </p>
          <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
            <li>The database connection is unavailable</li>
            <li>No data has been synchronized yet</li>
            <li>There's a temporary network issue</li>
          </ul>
          <div className="mt-6">
            <Button onClick={() => reset()} className="w-full">
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Step 8: Update Queries for Dashboard

### 8.1 Update Query Functions

Update `src/lib/queries.ts` to add aggregation functions:

```typescript
// Add to existing queries.ts

// Get monthly revenue data for charts
export async function getMonthlyRevenue(months: number = 6) {
  const startDate = subMonths(new Date(), months)

  const monthlyData = await db.execute(sql`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', ${startDate}::date),
        date_trunc('month', CURRENT_DATE),
        '1 month'::interval
      )::date as month
    ),
    invoice_data AS (
      SELECT
        date_trunc('month', invoice_date)::date as month,
        SUM(CASE WHEN type = 'ACCREC' THEN total ELSE 0 END) as revenue
      FROM milestone.invoices
      WHERE status IN ('AUTHORISED', 'PAID')
        AND invoice_date >= ${startDate}
      GROUP BY date_trunc('month', invoice_date)
    ),
    bill_data AS (
      SELECT
        date_trunc('month', bill_date)::date as month,
        SUM(total) as costs
      FROM milestone.bills
      WHERE status IN ('AUTHORISED', 'PAID')
        AND bill_date >= ${startDate}
      GROUP BY date_trunc('month', bill_date)
    )
    SELECT
      TO_CHAR(m.month, 'Mon YYYY') as month,
      COALESCE(i.revenue, 0) as revenue,
      COALESCE(b.costs, 0) as costs,
      COALESCE(i.revenue, 0) - COALESCE(b.costs, 0) as profit
    FROM months m
    LEFT JOIN invoice_data i ON m.month = i.month
    LEFT JOIN bill_data b ON m.month = b.month
    ORDER BY m.month
  `)

  return monthlyData.rows
}

// Get top projects by profitability
export async function getTopProjects(limit: number = 10) {
  const projects = await db.execute(sql`
    SELECT
      project_id,
      project_name,
      client_name,
      SUM(actual_revenue) as total_revenue,
      SUM(actual_costs) as total_costs,
      SUM(profit) as total_profit,
      AVG(profit_margin) as avg_margin
    FROM milestone.project_phase_summary
    GROUP BY project_id, project_name, client_name
    ORDER BY total_profit DESC
    LIMIT ${limit}
  `)

  return projects.rows
}

// Get phase breakdown for a project
export async function getProjectPhases(projectId: string) {
  const phases = await db.execute(sql`
    SELECT *
    FROM milestone.project_phase_summary
    WHERE project_id = ${projectId}
    ORDER BY phase_order
  `)

  return phases.rows
}
```

## Step 9: Test Dashboard

### 9.1 Ensure Data Exists

If you haven't run the seed script from Phase 2:

```bash
npm run db:seed
```

### 9.2 Test Dashboard

1. Start the development server:
```bash
npm run dev
```

2. Sign in and navigate to `/dashboard`

3. Verify:
   - Stats cards display correct values
   - Charts render properly
   - Table shows project data
   - Sorting and filtering work
   - Responsive design on mobile

## Step 10: Performance Optimization

### 10.1 Add Data Caching (Optional)

Create `src/lib/cache.ts`:

```typescript
import { unstable_cache } from 'next/cache'
import { getDashboardStats, getProjectSummaries } from './queries'

// Cache dashboard stats for 5 minutes
export const getCachedDashboardStats = unstable_cache(
  async () => getDashboardStats(),
  ['dashboard-stats'],
  {
    revalidate: 300, // 5 minutes
    tags: ['dashboard'],
  }
)

// Cache project summaries for 5 minutes
export const getCachedProjectSummaries = unstable_cache(
  async () => getProjectSummaries(),
  ['project-summaries'],
  {
    revalidate: 300, // 5 minutes
    tags: ['projects'],
  }
)
```

## Phase 4 Complete Checklist

- [ ] Chart components created (Revenue & Profit)
- [ ] Stats cards implemented
- [ ] Projects table with sorting and filtering
- [ ] Dashboard page with real data
- [ ] Loading states added
- [ ] Error handling implemented
- [ ] Server Components for data fetching
- [ ] Responsive design
- [ ] Performance optimizations
- [ ] Data aggregation for charts

## Common Issues and Solutions

### Issue: Charts not rendering
**Solution**: Ensure you're using 'use client' directive for Recharts components

### Issue: No data showing
**Solution**: Run seed script or ensure n8n has synced data:
```bash
npm run db:seed
```

### Issue: Type errors with Recharts
**Solution**: Install types:
```bash
npm install --save-dev @types/recharts
```

### Issue: Slow dashboard load
**Solution**: Ensure materialized view is refreshed:
```sql
SELECT milestone.refresh_summary();
```

## Next Steps

Phase 4 is complete! The dashboard is now fully functional with real data visualization.

Proceed to [Phase 5: Project Features](./phase-5-project-features.md) to:
- Implement project list page
- Create project detail view
- Add estimates CRUD functionality
- Build invoice and bill displays

## Project Status

```
✅ Phase 1: Project Initialization - COMPLETE
✅ Phase 2: Database Setup - COMPLETE
✅ Phase 3: Authentication - COMPLETE
✅ Phase 4: Dashboard Implementation - COMPLETE
⏳ Phase 5: Project Features - PENDING
⏳ Phase 6: Export Functionality - PENDING
⏳ Phase 7: Deployment - PENDING
```

---

*Estimated time: 4-5 hours*
*Last updated: Phase 4 Complete*