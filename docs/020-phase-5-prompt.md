# Phase 5: Project Features & Estimates CRUD - Implementation Prompt

## Context Initialization
You are tasked with implementing Phase 5 of the Milestone P&L Dashboard project. This phase adds the projects list page, individual project details, and full CRUD functionality for estimates using Server Actions.

## Pre-Implementation Requirements

### 1. Document Review
First, thoroughly read and understand these documents in this exact order:
1. `/root/projects/milestone-app/project-plan.md` - Review data ownership model
2. `/root/projects/milestone-app/phase-5-project-features.md` - Project features specification
3. `/root/projects/milestone-app/phase-5-tasks.md` - Study all 54 tasks (T164-T217)
4. `/root/projects/milestone-app/phase-5-QA.md` - Understand validation requirements
5. Review `.reference` folder for table and detail page designs

### 2. Context Building
Before starting implementation:
- Use `mcp__context7__resolve-library-id` and `mcp__context7__get-library-docs` to research:
  - Next.js 15 Server Actions
  - Form handling with Server Actions
  - Optimistic updates in React
  - Data revalidation patterns
- Use WebSearch to find:
  - Server Actions best practices (2024)
  - Form validation with Zod
  - Dialog/Modal patterns with shadcn/ui
  - CRUD operations with Server Actions

### 3. Architecture Understanding
**CRITICAL**: Understand the data model:
- Xero data (projects, invoices, bills) = READ-ONLY
- User data (estimates) = FULL CRUD with UUIDs
- Estimates belong to projects and build phases
- All modifications use Server Actions (NOT API routes)

## Implementation Instructions

### Phase 5 Task Execution (T164-T217)

#### Projects List Page (T164-T173):

Route structure:
```
src/app/(authenticated)/projects/
├── page.tsx              # Server Component - projects list
├── [id]/
│   ├── page.tsx         # Server Component - project detail
│   └── actions.ts       # Server Actions for estimates
└── loading.tsx
```

Projects list page features:
```typescript
// src/app/(authenticated)/projects/page.tsx
export default async function ProjectsPage() {
  const { userId } = auth();
  const projects = await getProjects(userId);

  return (
    <>
      {/* Header with toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects P&L Dashboard</h1>
        <ToggleNavigation activeView="projects" />
      </div>

      {/* Projects table with ALL required columns */}
      <ProjectsTable projects={projects} />
    </>
  );
}
```

Table requirements (T168-T173):
- Columns: Project Name, Revenue, Cost of Sales, Operating Exp., Net Profit, Margin %, Visual
- Profit/loss color coding (green/red)
- Visual profit bars
- Click row to navigate to detail
- Server-side data fetching

#### Project Detail Page (T174-T183):

```typescript
// src/app/(authenticated)/projects/[id]/page.tsx
export default async function ProjectDetailPage({
  params
}: {
  params: { id: string }
}) {
  const project = await getProjectWithDetails(params.id);

  return (
    <>
      {/* Back button */}
      <Link href="/projects">
        <Button variant="ghost">← Back to All Projects</Button>
      </Link>

      {/* Project header */}
      <ProjectHeader project={project} />

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4 my-6">
        <KPICard title="TOTAL INCOME" value={project.revenue} />
        <KPICard title="GROSS PROFIT" value={project.grossProfit} isProfit />
        <KPICard title="NET PROFIT" value={project.netProfit} isProfit />
      </div>

      {/* Financial breakdown */}
      <FinancialBreakdown project={project} />

      {/* Tabs for Invoices, Bills, Estimates */}
      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
          <TabsTrigger value="estimates">Estimates</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <InvoicesTable invoices={project.invoices} />
        </TabsContent>

        <TabsContent value="bills">
          <BillsTable bills={project.bills} />
        </TabsContent>

        <TabsContent value="estimates">
          <EstimatesSection
            projectId={project.id}
            estimates={project.estimates}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
```

#### Estimates CRUD Implementation (T184-T207):

**CRITICAL - Server Actions Setup:**
```typescript
// src/app/(authenticated)/projects/[id]/actions.ts
'use server'

import { auth } from "@clerk/nextjs";
import { db } from "@/db";
import { estimates } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const estimateSchema = z.object({
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  date: z.string(),
  project_id: z.string(),
  build_phase_id: z.string().optional(),
});

export async function createEstimate(formData: FormData) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const data = estimateSchema.parse({
    description: formData.get("description"),
    amount: parseFloat(formData.get("amount") as string),
    date: formData.get("date"),
    project_id: formData.get("project_id"),
    build_phase_id: formData.get("build_phase_id"),
  });

  // Create with UUID
  await db.insert(estimates).values({
    id: crypto.randomUUID(), // UUID for user content
    ...data,
    created_by: userId,
    created_at: new Date(),
  });

  revalidatePath(`/projects/${data.project_id}`);
}

export async function updateEstimate(id: string, formData: FormData) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify ownership
  const estimate = await db.query.estimates.findFirst({
    where: eq(estimates.id, id),
  });

  if (estimate?.created_by !== userId) {
    throw new Error("Unauthorized");
  }

  // Update logic...
  revalidatePath(`/projects/${estimate.project_id}`);
}

export async function deleteEstimate(id: string) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify ownership and delete...
  revalidatePath(`/projects/${estimate.project_id}`);
}
```

**Estimates UI Components (T194-T197):**
```typescript
// Client Component for form handling
'use client'

export function EstimateForm({
  projectId,
  buildPhases,
  onSuccess
}: EstimateFormProps) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createEstimate(formData);
      onSuccess?.();
    });
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="project_id" value={projectId} />

      <Label>Description</Label>
      <Input name="description" required />

      <Label>Amount (GBP)</Label>
      <Input name="amount" type="number" step="0.01" required />

      <Label>Build Phase</Label>
      <Select name="build_phase_id">
        {buildPhases.map(phase => (
          <SelectItem key={phase.id} value={phase.id}>
            {phase.name}
          </SelectItem>
        ))}
      </Select>

      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create Estimate"}
      </Button>
    </form>
  );
}
```

#### Build Phases Support (T208-T212):
```sql
-- Predefined build phases in database
INSERT INTO build_phases (id, name, order) VALUES
  ('design', 'Design & Planning', 1),
  ('foundation', 'Foundation', 2),
  ('structure', 'Structure', 3),
  ('roofing', 'Roofing', 4),
  ('electrical', 'Electrical', 5),
  ('plumbing', 'Plumbing', 6),
  ('finishing', 'Finishing', 7);
```

#### Authorization & Validation (T213-T217):
- Users can only CRUD their own estimates
- Validate all inputs with Zod
- Check project ownership
- Audit log all changes
- Handle errors gracefully

### Key Implementation Points:

1. **Server Actions vs API Routes:**
   - Use Server Actions for ALL data mutations
   - Maximum 3-5 Server Actions total
   - No separate API routes needed

2. **UUID Usage:**
   - Estimates MUST use UUID primary keys
   - Generate with `crypto.randomUUID()`
   - Projects keep Xero string IDs

3. **Data Revalidation:**
   - Use `revalidatePath()` after mutations
   - Refresh project detail page
   - Update cached data

4. **Form Patterns:**
   - Progressive enhancement
   - Works without JavaScript
   - Optimistic updates optional

## Quality Assurance Execution

After completing ALL tasks (T164-T217), execute the QA validation:

### Phase 5 QA Validation (QA201-QA250)

Critical QA checks:
- QA201-QA210: Projects list functionality
- QA211-QA220: Project detail page
- QA221-QA230: Estimates display
- QA231-QA240: CRUD operations
- QA241-QA250: Authorization and security

### Testing Checklist:
```bash
# 1. Projects List
- Navigate to /projects
- Verify all projects display
- Check profit/loss colors
- Test row click navigation

# 2. Project Detail
- Open individual project
- Verify KPI cards
- Check financial breakdown
- Test tab switching

# 3. Estimates CRUD
- Create new estimate
- Edit existing estimate
- Delete estimate
- Verify UUID generation
- Check authorization

# 4. Server Actions
- Verify no API routes created
- Check form submissions work
- Test error handling
- Verify revalidation
```

## Success Criteria
Phase 5 is complete when:
- [ ] All 54 tasks (T164-T217) completed
- [ ] All 50 QA checks (QA201-QA250) pass
- [ ] Projects list displays all projects
- [ ] Project detail shows complete information
- [ ] Estimates CRUD fully functional
- [ ] Server Actions working (no API routes)
- [ ] UUIDs used for estimates
- [ ] Authorization properly enforced
- [ ] Build phases integrated
- [ ] Forms work without JavaScript

## Common Issues & Solutions

1. **Server Actions not working:**
   - Ensure 'use server' directive at top
   - Check auth() is called inside action
   - Verify revalidatePath() called

2. **UUID not generating:**
   ```typescript
   // Correct:
   id: crypto.randomUUID()
   // Wrong:
   id: uuidv4() // Don't import external UUID library
   ```

3. **Forms not submitting:**
   - Check action attribute points to Server Action
   - Verify FormData parsing
   - Ensure proper error handling

4. **Authorization failing:**
   - Always check userId from auth()
   - Verify ownership before mutations
   - Log to audit_log table

## Verification Commands
```bash
# Check Server Actions
grep -r "use server" src/app/

# Verify no API routes for estimates
ls -la src/app/api/ | grep -v webhooks

# Check estimates table has UUID
npx drizzle-kit studio
# Verify estimates.id is UUID type

# Test build
npm run build
```

## Critical Notes
- DO NOT create API routes for CRUD operations
- DO NOT use string IDs for estimates (must be UUID)
- DO NOT allow cross-user data access
- DO NOT skip authorization checks
- Keep Server Actions minimal (3-5 total)
- Remember: Xero data is read-only

Upon completion, Phase 5 should provide full project management features with estimates CRUD, ready for export functionality in Phase 6.