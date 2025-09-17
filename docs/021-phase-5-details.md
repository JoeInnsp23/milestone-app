# Phase 5: Project Features

## Overview
This phase implements the project list page, detailed project view with invoices/bills display, and the complete estimates CRUD functionality. The UI design follows the existing MVP project pages shown in `.reference/Screenshot*.png` files.

## UI Reference from Existing MVP
The project pages must match the existing MVP design:
- **All Projects View**: Table with clickable rows showing Project Name, Revenue, Cost of Sales, Operating Exp., Net Profit, Margin %, and Visual indicator (see `.reference/Screenshot 2025-09-17 at 10.24.38.png`)
- **Project Detail View**: Blue gradient background with KPI cards for Total Income, Gross Profit, Net Profit (see `.reference/Screenshot 2025-09-17 at 10.24.51.png`)
- **Financial Breakdown**: Income Breakdown, Cost of Sales, Operating Expenses sections with line items
- **Color Scheme**: Consistent green (#10b981) for positive values, red (#ef4444) for negative values
- **Navigation**: "Back to All Projects" button

## Prerequisites
- Phases 1-4 completed successfully
- Dashboard working with real data
- Database populated with project data

## Step 1: Create Projects List Page

### 1.1 Create Projects Page with Server Component

Update `src/app/(protected)/projects/page.tsx`:

```typescript
import { getProjects } from '@/lib/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react'

// Client component for interactive filtering
import { ProjectsFilter } from '@/components/projects-filter'

export default async function ProjectsPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  // Fetch all projects and company info using Server Component
  const [projects, companyInfo] = await Promise.all([
    getProjects({ isActive: true }),
    getCompanyInfo()
  ])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    // Matching MVP layout - gradient only in header
    <div className="min-h-screen bg-background">
      <div className="gradient-bg-light dark:gradient-bg-dark pb-1">
        <div className="container mx-auto p-6">
          {/* Page Header matching MVP */}
          <div className="bg-card/95 backdrop-blur rounded-lg p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Projects P&L Dashboard</h1>
                <p className="text-white/80">
                  {companyInfo.name} - {format(companyInfo.date_from, 'dd MMMM yyyy')} to {format(companyInfo.date_to, 'dd MMMM yyyy')}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`${basePath}/dashboard`}>
                  <Button variant="outline" className="border-white text-white hover:bg-white/10">
                    Overview
                  </Button>
                </Link>
                <Button variant="default" className="bg-white text-primary hover:bg-white/90">
                  All Projects
                </Button>
              </div>
          </div>
        </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.count}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pipeline Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Expected revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estimated Costs
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.costs)}
            </div>
            <p className="text-xs text-muted-foreground">
              Projected expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Projects Table */}
      <ProjectsFilter initialProjects={projects} />
    </div>
  )
}
```

### 1.2 Create Client-Side Filter Component

Create `src/components/projects-filter.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Search,
  ExternalLink,
  Calendar,
  User,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Project } from '@/types'

interface ProjectsFilterProps {
  initialProjects: Project[]
}

export function ProjectsFilter({ initialProjects }: ProjectsFilterProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Project
    direction: 'asc' | 'desc'
  } | null>(null)

  const projectsPerPage = 10

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || project.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue === null) return 1
    if (bValue === null) return -1
    if (aValue === bValue) return 0

    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Paginate projects
  const totalPages = Math.ceil(sortedProjects.length / projectsPerPage)
  const startIndex = (currentPage - 1) * projectsPerPage
  const paginatedProjects = sortedProjects.slice(
    startIndex,
    startIndex + projectsPerPage
  )

  const handleSort = (key: keyof Project) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('en-GB').format(new Date(date))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Projects</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-8 w-64"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('name')}
                    className="h-8 p-0"
                  >
                    Project Name
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
                <TableHead>Project Manager</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('start_date')}
                    className="h-8 p-0"
                  >
                    Start Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('end_date')}
                    className="h-8 p-0"
                  >
                    End Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.name}
                    </TableCell>
                    <TableCell>{project.client_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {project.project_manager || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(project.start_date)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(project.end_date)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`${basePath}/projects/${project.id}`}>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to{' '}
              {Math.min(startIndex + projectsPerPage, sortedProjects.length)} of{' '}
              {sortedProjects.length} projects
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {[...Array(totalPages)].map((_, index) => (
                  <Button
                    key={index + 1}
                    variant={currentPage === index + 1 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(index + 1)}
                    className="w-8 h-8 p-0"
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

## Step 2: Create Project Detail Page

### 2.1 Create Dynamic Route for Project Detail

Create `src/app/(protected)/projects/[id]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { getProjectById } from '@/lib/queries'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProjectInvoices } from '@/components/project-invoices'
import { ProjectBills } from '@/components/project-bills'
import { ProjectEstimates } from '@/components/project-estimates'
import {
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  FileText,
  Receipt,
  Calculator,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const project = await getProjectById(params.id)

  if (!project) {
    notFound()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Calculate project totals
  const totalRevenue = project.invoices
    .filter((inv) => inv.type === 'ACCREC')
    .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)

  const totalCosts = project.bills
    .reduce((sum, bill) => sum + (Number(bill.total) || 0), 0)

  const profit = totalRevenue - totalCosts
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Back Button and Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`${basePath}/projects`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {project.name}
            </h1>
            <div className="mt-1 flex items-center space-x-4 text-sm text-muted-foreground">
              {project.client_name && (
                <span>Client: {project.client_name}</span>
              )}
              {project.project_manager && (
                <span className="flex items-center">
                  <User className="mr-1 h-3 w-3" />
                  {project.project_manager}
                </span>
              )}
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {project.invoices.filter(i => i.type === 'ACCREC').length} invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costs</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCosts)}
            </div>
            <p className="text-xs text-muted-foreground">
              {project.bills.length} bills
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {profitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {project.start_date && (
                <div>Start: {format(new Date(project.start_date), 'dd/MM/yyyy')}</div>
              )}
              {project.end_date && (
                <div>End: {format(new Date(project.end_date), 'dd/MM/yyyy')}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="estimates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="estimates" className="flex items-center space-x-2">
            <Calculator className="h-4 w-4" />
            <span>Estimates</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Invoices ({project.invoices.length})</span>
          </TabsTrigger>
          <TabsTrigger value="bills" className="flex items-center space-x-2">
            <Receipt className="h-4 w-4" />
            <span>Bills ({project.bills.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estimates">
          <ProjectEstimates
            projectId={project.id}
            buildPhases={project.buildPhases || []}
            estimates={project.estimates}
          />
        </TabsContent>

        <TabsContent value="invoices">
          <ProjectInvoices invoices={project.invoices} />
        </TabsContent>

        <TabsContent value="bills">
          <ProjectBills bills={project.bills} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### 2.2 Install Additional UI Components

```bash
npx shadcn@latest add tabs
npx shadcn@latest add form
npx shadcn@latest add textarea
npx shadcn@latest add alert-dialog
```

## Step 3: Create Invoice Display Component

### 3.1 Create Invoices Component

Create `src/components/project-invoices.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Invoice } from '@/types'
import { format } from 'date-fns'
import { FileText, Download, Eye, Calendar, DollarSign } from 'lucide-react'

interface ProjectInvoicesProps {
  invoices: Invoice[]
}

export function ProjectInvoices({ invoices }: ProjectInvoicesProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-'
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'AUTHORISED':
        return 'bg-blue-100 text-blue-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800'
      case 'VOIDED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const salesInvoices = invoices.filter(inv => inv.type === 'ACCREC')
  const creditNotes = invoices.filter(inv => inv.type === 'ACCPAY')

  return (
    <div className="space-y-6">
      {/* Sales Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Sales Invoices</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {salesInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices found for this project.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        {invoice.invoice_date
                          ? format(new Date(invoice.invoice_date), 'dd/MM/yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {invoice.due_date
                          ? format(new Date(invoice.due_date), 'dd/MM/yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>{invoice.contact_name || '-'}</TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(invoice.amount_paid)}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        {formatCurrency(invoice.amount_due)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary */}
          {salesInvoices.length > 0 && (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Invoiced</span>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-semibold">
                  {formatCurrency(
                    salesInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
                  )}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Paid</span>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-xl font-semibold text-green-600">
                  {formatCurrency(
                    salesInvoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0)
                  )}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Outstanding</span>
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-xl font-semibold text-orange-600">
                  {formatCurrency(
                    salesInvoices.reduce((sum, inv) => sum + (inv.amount_due || 0), 0)
                  )}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Notes (if any) */}
      {creditNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Credit Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Credit Note #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditNotes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell>{note.invoice_number}</TableCell>
                      <TableCell>
                        {note.invoice_date
                          ? format(new Date(note.invoice_date), 'dd/MM/yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-red-600">
                        -{formatCurrency(note.total)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(note.status)}>
                          {note.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

## Step 4: Create Bills Display Component

### 4.1 Create Bills Component

Create `src/components/project-bills.tsx`:

```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Bill } from '@/types'
import { format } from 'date-fns'
import { Receipt, DollarSign } from 'lucide-react'

interface ProjectBillsProps {
  bills: Bill[]
}

export function ProjectBills({ bills }: ProjectBillsProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return '-'
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'AUTHORISED':
        return 'bg-blue-100 text-blue-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800'
      case 'VOIDED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const regularBills = bills.filter(bill => bill.type === 'BILL')
  const purchaseOrders = bills.filter(bill => bill.type === 'PURCHASEORDER')

  return (
    <div className="space-y-6">
      {/* Regular Bills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>Bills & Expenses</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {regularBills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bills found for this project.</p>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regularBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">
                          {bill.bill_number || '-'}
                        </TableCell>
                        <TableCell>
                          {bill.bill_date
                            ? format(new Date(bill.bill_date), 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {bill.due_date
                            ? format(new Date(bill.due_date), 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>{bill.contact_name || '-'}</TableCell>
                        <TableCell>{formatCurrency(bill.total)}</TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(bill.amount_paid)}
                        </TableCell>
                        <TableCell className="text-orange-600">
                          {formatCurrency(bill.amount_due)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(bill.status)}>
                            {bill.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Bills</span>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-semibold">
                    {formatCurrency(
                      regularBills.reduce((sum, bill) => sum + (bill.total || 0), 0)
                    )}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Paid</span>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xl font-semibold text-green-600">
                    {formatCurrency(
                      regularBills.reduce((sum, bill) => sum + (bill.amount_paid || 0), 0)
                    )}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Outstanding</span>
                    <DollarSign className="h-4 w-4 text-orange-600" />
                  </div>
                  <p className="text-xl font-semibold text-orange-600">
                    {formatCurrency(
                      regularBills.reduce((sum, bill) => sum + (bill.amount_due || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Purchase Orders (if any) */}
      {purchaseOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell>{po.bill_number || '-'}</TableCell>
                      <TableCell>
                        {po.bill_date
                          ? format(new Date(po.bill_date), 'dd/MM/yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>{po.contact_name || '-'}</TableCell>
                      <TableCell>{formatCurrency(po.total)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(po.status)}>
                          {po.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

## Step 5: Create Estimates CRUD Component

### 5.1 Create Estimates Component with Full CRUD

Create `src/components/project-estimates.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'
import { ProjectEstimate } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  Plus,
  Edit,
  Trash2,
  Calculator,
  TrendingUp,
  TrendingDown,
  Clock,
  Package
} from 'lucide-react'
import { format } from 'date-fns'

const estimateSchema = z.object({
  build_phase_id: z.string().nullable(),
  estimate_type: z.enum(['revenue', 'cost', 'hours', 'materials']),
  amount: z.string().min(1, 'Amount is required'),
  confidence_level: z.string().optional(),
  notes: z.string().optional(),
})

type EstimateFormValues = z.infer<typeof estimateSchema>

interface ProjectEstimatesProps {
  projectId: string
  buildPhases: BuildPhase[]
  estimates: ProjectEstimate[]
}

export function ProjectEstimates({ projectId, buildPhases, estimates: initialEstimates }: ProjectEstimatesProps) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const [estimates, setEstimates] = useState(initialEstimates)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingEstimate, setEditingEstimate] = useState<ProjectEstimate | null>(null)
  const [deletingEstimate, setDeletingEstimate] = useState<ProjectEstimate | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  // React Hot Toast is imported above

  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      build_phase_id: null,
      estimate_type: 'revenue',
      amount: '',
      confidence_level: '3',
      notes: '',
    },
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'cost':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'hours':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'materials':
        return <Package className="h-4 w-4 text-purple-600" />
      default:
        return <Calculator className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'revenue':
        return 'text-green-600'
      case 'cost':
        return 'text-red-600'
      case 'hours':
        return 'text-blue-600'
      case 'materials':
        return 'text-purple-600'
      default:
        return ''
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const onSubmit = async (data: EstimateFormValues) => {
    setIsLoading(true)

    try {
      // Import server actions
      const { createEstimateAction, updateEstimateAction } = await import('@/app/actions/estimates')

      const estimateData = {
        project_id: projectId,
        build_phase_id: data.build_phase_id || null,
        estimate_type: data.estimate_type,
        amount: parseFloat(data.amount),
        confidence_level: data.confidence_level ? parseInt(data.confidence_level) : null,
        notes: data.notes || null,
      }

      const result = editingEstimate
        ? await updateEstimateAction(editingEstimate.id, estimateData)
        : await createEstimateAction(estimateData)

      if (!result.success) {
        throw new Error(result.error)
      }

      const savedEstimate = result.data

      if (editingEstimate) {
        setEstimates(estimates.map(e =>
          e.id === savedEstimate.id ? savedEstimate : e
        ))
        toast.success('Estimate updated successfully')
      } else {
        setEstimates([...estimates, savedEstimate])
        toast.success('Estimate created successfully')
      }

      setIsCreateOpen(false)
      setEditingEstimate(null)
      form.reset()
      router.refresh()
    } catch (error) {
      console.error('Error saving estimate:', error)
      toast.error('Failed to save estimate. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (estimate: ProjectEstimate) => {
    setEditingEstimate(estimate)
    form.reset({
      estimate_type: estimate.estimate_type,
      amount: estimate.amount.toString(),
      confidence_level: estimate.confidence_level?.toString() || '3',
      notes: estimate.notes || '',
    })
    setIsCreateOpen(true)
  }

  const handleDelete = async (estimate: ProjectEstimate) => {
    setIsLoading(true)

    try {
      // Import server action
      const { deleteEstimateAction } = await import('@/app/actions/estimates')

      const result = await deleteEstimateAction(estimate.id, projectId)

      if (!result.success) {
        throw new Error(result.error)
      }

      setEstimates(estimates.filter(e => e.id !== estimate.id))
      toast.success('Estimate deleted successfully')
      router.refresh()
    } catch (error) {
      console.error('Error deleting estimate:', error)
      toast.error('Failed to delete estimate. Please try again.')
    } finally {
      setIsLoading(false)
      setDeletingEstimate(null)
    }
  }

  // Group estimates by type
  const groupedEstimates = estimates.reduce((acc, estimate) => {
    if (!acc[estimate.estimate_type]) {
      acc[estimate.estimate_type] = []
    }
    acc[estimate.estimate_type].push(estimate)
    return acc
  }, {} as Record<string, ProjectEstimate[]>)

  // Calculate totals
  const totals = {
    revenue: estimates
      .filter(e => e.estimate_type === 'revenue')
      .reduce((sum, e) => sum + e.amount, 0),
    cost: estimates
      .filter(e => e.estimate_type === 'cost')
      .reduce((sum, e) => sum + e.amount, 0),
    hours: estimates
      .filter(e => e.estimate_type === 'hours')
      .reduce((sum, e) => sum + e.amount, 0),
    materials: estimates
      .filter(e => e.estimate_type === 'materials')
      .reduce((sum, e) => sum + e.amount, 0),
  }

  const estimatedProfit = totals.revenue - totals.cost - totals.materials
  const estimatedMargin = totals.revenue > 0 ? (estimatedProfit / totals.revenue) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.revenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Costs</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.cost + totals.materials)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Profit</CardTitle>
            <Calculator className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${estimatedProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(estimatedProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Margin</CardTitle>
            <Calculator className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {estimatedMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estimates List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Project Estimates</span>
            </CardTitle>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingEstimate(null)
                  form.reset()
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Estimate
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingEstimate ? 'Edit Estimate' : 'Create Estimate'}
                  </DialogTitle>
                  <DialogDescription>
                    Add estimates for revenue, costs, hours, or materials for this project.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {buildPhases.length > 0 && (
                      <FormField
                        control={form.control}
                        name="build_phase_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Build Phase (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select phase" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">No specific phase</SelectItem>
                                {buildPhases.map((phase) => (
                                  <SelectItem key={phase.id} value={phase.id}>
                                    {phase.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="estimate_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="revenue">Revenue</SelectItem>
                              <SelectItem value="cost">Cost</SelectItem>
                              <SelectItem value="hours">Hours</SelectItem>
                              <SelectItem value="materials">Materials</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the amount in GBP (or hours if type is Hours)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confidence_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confidence Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select confidence" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 - Very Low</SelectItem>
                              <SelectItem value="2">2 - Low</SelectItem>
                              <SelectItem value="3">3 - Medium</SelectItem>
                              <SelectItem value="4">4 - High</SelectItem>
                              <SelectItem value="5">5 - Very High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How confident are you in this estimate?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any additional notes..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateOpen(false)
                          setEditingEstimate(null)
                          form.reset()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : editingEstimate ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {estimates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No estimates added yet. Click "Add Estimate" to create your first estimate.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedEstimates).map(([type, typeEstimates]) => (
                <div key={type} className="space-y-2">
                  <h4 className="text-sm font-medium capitalize flex items-center space-x-2">
                    {getTypeIcon(type)}
                    <span>{type}</span>
                  </h4>
                  <div className="space-y-2">
                    {typeEstimates.map((estimate) => (
                      <div
                        key={estimate.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <span className={`text-lg font-semibold ${getTypeColor(type)}`}>
                              {type === 'hours'
                                ? `${estimate.amount} hours`
                                : formatCurrency(estimate.amount)
                              }
                            </span>
                            {estimate.confidence_level && (
                              <span className="text-xs text-muted-foreground">
                                Confidence: {estimate.confidence_level}/5
                              </span>
                            )}
                          </div>
                          {estimate.notes && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {estimate.notes}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            Added {format(new Date(estimate.created_at), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(estimate)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingEstimate(estimate)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingEstimate}
        onOpenChange={() => setDeletingEstimate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this estimate. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEstimate && handleDelete(deletingEstimate)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

## Step 6: Create Server Actions for Estimates

### 6.1 Create Estimate Actions

Create `src/app/actions/estimates.ts`:

```typescript
'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createEstimate, updateEstimate, deleteEstimate } from '@/lib/queries'
import { z } from 'zod'

const estimateSchema = z.object({
  project_id: z.string(),
  build_phase_id: z.string().nullable(),
  estimate_type: z.enum(['revenue', 'cost', 'hours', 'materials']),
  amount: z.number(),
  confidence_level: z.number().min(1).max(5).nullable(),
  notes: z.string().nullable(),
})

export async function createEstimateAction(data: z.infer<typeof estimateSchema>) {
  try {
    const { userId } = auth()
    const user = await currentUser()

    if (!userId) {
      throw new Error('Unauthorized')
    }

    // Validate data
    const validatedData = estimateSchema.parse(data)

    // Create estimate with UUID (handled by database defaultRandom())
    const estimate = await createEstimate(
      {
        ...validatedData,
        created_by: userId,
        updated_by: userId,
      },
      userId,
      user?.primaryEmailAddress?.emailAddress
    )

    // Revalidate the project page
    revalidatePath(`/projects/${data.project_id}`)

    return { success: true, data: estimate }
  } catch (error) {
    console.error('Error creating estimate:', error)
    return { success: false, error: 'Failed to create estimate' }
  }
}

export async function updateEstimateAction(
  id: string,
  data: Partial<z.infer<typeof estimateSchema>>
) {
  try {
    const { userId } = auth()
    const user = await currentUser()

    if (!userId) {
      throw new Error('Unauthorized')
    }

    // Update estimate
    const updated = await updateEstimate(
      id,
      {
        ...data,
        updated_by: userId,
      },
      userId,
      user?.primaryEmailAddress?.emailAddress
    )

    // Revalidate the project page
    if (updated.project_id) {
      revalidatePath(`/projects/${updated.project_id}`)
    }

    return { success: true, data: updated }
  } catch (error) {
    console.error('Error updating estimate:', error)
    return { success: false, error: 'Failed to update estimate' }
  }
}

export async function deleteEstimateAction(id: string, projectId: string) {
  try {
    const { userId } = auth()
    const user = await currentUser()

    if (!userId) {
      throw new Error('Unauthorized')
    }

    // Soft delete estimate
    await deleteEstimate(
      id,
      userId,
      user?.primaryEmailAddress?.emailAddress
    )

    // Revalidate the project page
    revalidatePath(`/projects/${projectId}`)

    return { success: true }
  } catch (error) {
    console.error('Error deleting estimate:', error)
    return { success: false, error: 'Failed to delete estimate' }
  }
}
```

## Step 7: Install Form Dependencies

### 7.1 Install Required Packages

```bash
npm install react-hook-form @hookform/resolvers
# Using React Hot Toast instead of shadcn toast
npm install react-hot-toast
npx shadcn@latest add dialog
```

### 7.2 Add Toast Provider

Update `src/app/(protected)/layout.tsx`:

```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { NavHeader } from '@/components/nav-header'
import { Toaster } from 'react-hot-toast'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <div className="container py-6">
        {children}
      </div>
      <Toaster />
    </div>
  )
}
```

## Phase 5 Complete Checklist

- [ ] Projects list page with filtering and search
- [ ] Project detail page with tabs
- [ ] Invoices display (read-only from DB)
- [ ] Bills display (read-only from DB)
- [ ] Estimates CRUD functionality (user-editable)
- [ ] API routes for estimates
- [ ] Form validation with Zod
- [ ] Audit logging for estimates
- [ ] Responsive design for all components
- [ ] Loading and error states

## Common Issues and Solutions

### Issue: Estimates not saving
**Solution**: Check that the API routes are correctly configured and database permissions allow INSERT/UPDATE on project_estimates table

### Issue: Form validation errors
**Solution**: Ensure all required fields are provided and match the Zod schema

### Issue: Toast notifications not showing
**Solution**: Verify Toaster component is added to the layout

### Issue: Project not found
**Solution**: Ensure project ID exists in database and user has permission to view it

## Next Steps

Phase 5 is complete! All project features are now implemented including the complete estimates CRUD system.

Proceed to [Phase 6: Export Functionality](./phase-6-export-functionality.md) to:
- Implement PDF generation
- Add Excel export with streaming
- Create export API endpoints
- Handle large datasets

## Project Status

```
✅ Phase 1: Project Initialization - COMPLETE
✅ Phase 2: Database Setup - COMPLETE
✅ Phase 3: Authentication - COMPLETE
✅ Phase 4: Dashboard Implementation - COMPLETE
✅ Phase 5: Project Features - COMPLETE
⏳ Phase 6: Export Functionality - PENDING
⏳ Phase 7: Deployment - PENDING
```

---

*Estimated time: 4-5 hours*
*Last updated: Phase 5 Complete*