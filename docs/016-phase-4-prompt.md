# Phase 4: Dashboard Implementation - Implementation Prompt

## Context Initialization
You are tasked with implementing Phase 4 of the Milestone P&L Dashboard project. This phase creates the main dashboard with KPI cards, financial charts, and project overview matching the MVP design.

## Pre-Implementation Requirements

### 1. Document Review
First, thoroughly read and understand these documents in this exact order:
1. `/root/projects/milestone-app/project-plan.md` - Review data flow from n8n
2. `/root/projects/milestone-app/phase-4-dashboard-implementation.md` - Dashboard specification
3. `/root/projects/milestone-app/phase-4-tasks.md` - Study all 49 tasks (T115-T163)
4. `/root/projects/milestone-app/phase-4-QA.md` - Understand validation requirements
5. Review ALL files in `.reference` folder for exact MVP design

### 2. Context Building
Before starting implementation:
- Use `mcp__context7__resolve-library-id` and `mcp__context7__get-library-docs` to research:
  - Next.js 15 Server Components with data fetching
  - Tremor React components
  - Recharts with Next.js
  - Server Component patterns
- Use WebSearch to find:
  - Server Component data fetching best practices
  - Tremor React examples
  - Dashboard layout patterns
  - Currency formatting in UK (GBP)

### 3. Design Reference Review
**CRITICAL**: Study `.reference` folder screenshots:
```bash
ls -la .reference/
# Open and study each screenshot for:
# - Gradient header (blue to purple)
# - White content area (NOT gradient)
# - KPI card designs
# - Chart styles
# - Table layouts
```

## Implementation Instructions

### Phase 4 Task Execution (T115-T163)

#### Critical Design Rules:
1. **Gradient ONLY in header** - body content is white
2. **Dynamic company name** from database (NOT hardcoded)
3. **Dynamic date range** from database (NOT hardcoded)
4. **All currency in GBP** format (£1,234.56)
5. **Toggle buttons** for Overview/All Projects navigation

#### Package Installation (T115-T118):
```bash
npm install @tremor/react recharts date-fns
npm install -D @types/recharts
```

#### Dashboard Route Structure (T119-T122):
```
src/app/(authenticated)/
├── layout.tsx              # Auth wrapper with gradient header
└── dashboard/
    ├── page.tsx           # Server Component
    ├── loading.tsx        # Loading state
    └── error.tsx          # Error boundary
```

#### Authenticated Layout (T123-T127):
```typescript
// src/app/(authenticated)/layout.tsx
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  // Fetch company name and date range from database
  const companyData = await getCompanyData(userId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient header ONLY */}
      <div className="gradient-bg-light dark:gradient-bg-dark pb-1">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-white">
            {companyData.name} P&L Dashboard
          </h1>
          <p className="text-white/80">
            {companyData.dateRange}
          </p>
        </div>
      </div>

      {/* White content area */}
      <div className="container mx-auto p-6">
        {children}
      </div>
    </div>
  );
}
```

#### Dashboard Page Component (T128-T132):
```typescript
// src/app/(authenticated)/dashboard/page.tsx
export default async function DashboardPage() {
  const { userId } = auth();
  const data = await getDashboardData(userId);

  return (
    <>
      {/* Toggle Buttons */}
      <ToggleNavigation />

      {/* KPI Cards */}
      <KPICards data={data.kpis} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RevenueChart data={data.revenue} />
        <ProfitChart data={data.profit} />
      </div>

      {/* Projects Table */}
      <ProjectsOverview projects={data.projects} />
    </>
  );
}
```

#### KPI Cards Implementation (T133-T137):
Key requirements:
- 4 cards: Total Revenue, Total Costs, Net Profit, Active Projects
- White background with shadow
- Large number display
- Percentage change indicators
- Green for positive, red for negative

```typescript
// Example KPI Card
<Card className="bg-white">
  <CardContent>
    <p className="text-sm text-gray-600">TOTAL REVENUE</p>
    <p className="text-3xl font-bold">£45,000</p>
    <Badge className="mt-2" variant={change > 0 ? "success" : "destructive"}>
      {change > 0 ? "↑" : "↓"} {Math.abs(change)}%
    </Badge>
  </CardContent>
</Card>
```

#### Chart Components (T138-T147):
Use Tremor/Recharts for:
- Revenue trend (line chart)
- Profit/Loss by month (bar chart)
- Expense breakdown (donut chart)
- Project status (bar chart)

**IMPORTANT**: All charts must:
- Use consistent color scheme
- Show GBP currency format
- Have responsive sizing
- Include legends

#### Projects Table (T148-T152):
```typescript
// Table requirements:
- Columns: Project, Client, Revenue, Costs, Profit, Status
- Sortable columns
- Status badges (Active, Completed, On Hold)
- Profit/loss color coding (green/red)
- Click row to navigate (future phase)
```

#### Data Fetching Functions (T153-T157):
```typescript
// src/lib/dashboard-queries.ts
export async function getDashboardData(userId: string) {
  // Fetch from database using Drizzle
  const projects = await db.query.projects.findMany({
    where: eq(projects.user_id, userId),
  });

  // Calculate KPIs
  const kpis = calculateKPIs(projects);

  // Format for charts
  const chartData = formatChartData(projects);

  return { projects, kpis, chartData };
}
```

#### Navigation Toggle (T158-T163):
```typescript
// Toggle between Overview and All Projects
<div className="flex gap-2 mb-6">
  <Button variant={view === 'overview' ? 'default' : 'outline'}>
    Overview
  </Button>
  <Link href="/projects">
    <Button variant="outline">
      All Projects
    </Button>
  </Link>
</div>
```

### Critical Implementation Details:

1. **Server Components First:**
   - Dashboard page is Server Component
   - Fetch data server-side
   - Only use Client Components for interactivity

2. **Data Structure:**
   - Data comes from n8n webhook (already in database)
   - Read-only for Xero data
   - User can only modify estimates (Phase 5)

3. **Styling Requirements:**
   - Match `.reference` folder exactly
   - Gradient header, white content
   - Consistent spacing and typography
   - Mobile responsive

4. **Performance:**
   - Use React Suspense for loading states
   - Implement error boundaries
   - Cache dashboard queries

## Quality Assurance Execution

After completing ALL tasks (T115-T163), execute the QA validation:

### Phase 4 QA Validation (QA151-QA200)

Critical QA checks:
- QA151-QA160: Component installation and setup
- QA161-QA170: Layout and gradient validation
- QA171-QA180: KPI cards functionality
- QA181-QA190: Charts and data visualization
- QA191-QA200: Navigation and responsiveness

### Testing Commands:
```bash
# Start dev server
npm run dev

# Visit dashboard
# http://localhost:3000/dashboard

# Test data display:
# 1. KPI cards show correct values
# 2. Charts render with data
# 3. Table displays projects
# 4. Currency in GBP format
# 5. Responsive on mobile
```

## Success Criteria
Phase 4 is complete when:
- [ ] All 49 tasks (T115-T163) completed
- [ ] All 50 QA checks (QA151-QA200) pass
- [ ] Dashboard displays with gradient header ONLY
- [ ] Company name and dates are dynamic
- [ ] KPI cards show correct metrics
- [ ] Charts display with proper formatting
- [ ] Projects table works with sorting
- [ ] Navigation toggle functional
- [ ] All amounts in GBP (£)
- [ ] Mobile responsive
- [ ] Matches `.reference` design

## Common Issues & Solutions

1. **Gradient on entire page:**
   - Gradient should ONLY be on header
   - Body content must be white/gray background

2. **Hardcoded company name:**
   - Must fetch from database
   - Never hardcode "Innspired Accountancy"

3. **Charts not rendering:**
   - Ensure Tremor/Recharts installed
   - Check data format matches chart requirements
   - Verify Client Component usage for interactive charts

4. **Currency formatting:**
   ```typescript
   new Intl.NumberFormat('en-GB', {
     style: 'currency',
     currency: 'GBP',
   }).format(amount)
   ```

## Verification Commands
```bash
# Check packages installed
npm list @tremor/react recharts

# Verify dashboard route
ls -la src/app/\(authenticated\)/dashboard/

# Check for Server Components
grep -r "use client" src/app/\(authenticated\)/dashboard/

# Test build
npm run build
```

## Critical Notes
- DO NOT put gradient on entire page
- DO NOT hardcode company name or dates
- DO NOT create API routes - use Server Components
- DO NOT forget GBP currency formatting
- Keep charts simple and readable
- Focus on data accuracy over animations

Upon completion, Phase 4 should provide a fully functional dashboard displaying Xero data synced via n8n, ready for project features in Phase 5.