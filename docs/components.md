# Component Documentation

## Projects Components

### ProjectsFilter

A comprehensive filtering component for the projects list.

#### Props

```typescript
interface ProjectsFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}
```

#### Usage

```tsx
import { ProjectsFilter } from '@/components/projects/projects-filter';

function ProjectsPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });

  return (
    <ProjectsFilter onFilterChange={setFilters} />
  );
}
```

#### Features
- Real-time search with 300ms debounce
- Status filtering (Active, Completed, On Hold, Draft)
- Date range selection
- Clear all filters button

### ProjectsTable

Enhanced table component with sorting and filtering support.

#### Props

```typescript
interface ProjectsTableProps {
  projects: ProjectSummary[];
  filters?: FilterState;
  isLoading?: boolean;
}
```

#### Usage

```tsx
import { ProjectsTable } from '@/components/dashboard/projects-table';

<ProjectsTable
  projects={projectData}
  filters={currentFilters}
  isLoading={false}
/>
```

#### Features
- Column sorting (bidirectional)
- Search filtering by project/client name
- Status filtering
- Loading state with skeleton
- Profit visualization bars
- Clickable rows for navigation

### ProjectEstimates

Complete CRUD interface for project estimates with optimistic UI.

#### Props

```typescript
interface ProjectEstimatesProps {
  projectId: string;
  estimates: ProjectEstimate[];
}
```

#### Usage

```tsx
import { ProjectEstimates } from '@/components/projects/project-estimates';

<ProjectEstimates
  projectId={project.id}
  estimates={project.estimates || []}
/>
```

#### Features
- Create/Edit/Delete estimates
- Optimistic UI updates
- Form validation
- Pending state indicators
- Type-based color coding
- Confidence level tracking

### ProjectKPICards

Displays key performance indicators for a project.

#### Props

```typescript
interface ProjectKPICardsProps {
  totalIncome: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}
```

#### Usage

```tsx
import { ProjectKPICards } from '@/components/projects/project-kpi-cards';

<ProjectKPICards
  totalIncome={100000}
  grossProfit={60000}
  netProfit={40000}
  profitMargin={40}
/>
```

### ProjectTabs

Tab interface for invoices, bills, and estimates.

#### Props

```typescript
interface ProjectTabsProps {
  projectId: string;
  invoices: Invoice[];
  bills: Bill[];
  estimates: ProjectEstimate[];
}
```

#### Usage

```tsx
import { ProjectTabs } from '@/components/projects/project-tabs';

<ProjectTabs
  projectId={project.id}
  invoices={project.invoices}
  bills={project.bills}
  estimates={project.estimates}
/>
```

## UI Components

### TableSkeleton

Loading skeleton for tables.

#### Props

```typescript
interface TableSkeletonProps {
  rows?: number;    // Default: 5
  columns?: number; // Default: 7
}
```

#### Usage

```tsx
import { TableSkeleton } from '@/components/ui/table-skeleton';

<TableSkeleton rows={10} columns={5} />
```

### LoadingSpinner

Animated loading spinner.

#### Props

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'; // Default: 'md'
  className?: string;
}
```

#### Usage

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';

<button disabled={isLoading}>
  {isLoading ? <LoadingSpinner size="sm" /> : 'Submit'}
</button>
```

### Skeleton (from shadcn/ui)

Base skeleton component for loading states.

#### Props

```typescript
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
```

#### Usage

```tsx
import { Skeleton } from '@/components/ui/skeleton';

<Skeleton className="h-12 w-full" />
```

## Customization

### Styling

All components support custom styling through:
- `className` prop for additional CSS classes
- CSS variables for theming
- Tailwind utility classes

### Event Handlers

Components emit events for:
- Filter changes
- Sort changes
- CRUD operations
- Navigation actions

### State Management

Components use:
- Local state with `useState`
- Transitions with `useTransition`
- Optimistic updates for better UX
- Debounced inputs for performance

## Best Practices

1. **Loading States**: Always show loading indicators during async operations
2. **Error Handling**: Display user-friendly error messages
3. **Optimistic UI**: Update UI immediately for better perceived performance
4. **Accessibility**: All interactive elements are keyboard navigable
5. **Responsive Design**: Components adapt to mobile/tablet/desktop

## Examples

### Complete Projects Page

```tsx
export default function ProjectsPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="container">
      <ProjectsFilter onFilterChange={setFilters} />
      <ProjectsTable
        projects={projects}
        filters={filters}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### Loading Pattern

```tsx
function DataTable({ data, isLoading }) {
  if (isLoading) {
    return <TableSkeleton rows={10} columns={5} />;
  }

  return <ActualTable data={data} />;
}
```