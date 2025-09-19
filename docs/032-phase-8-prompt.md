# Phase 8: Construction Phases Feature - Implementation Prompt

## Context Initialization
You are tasked with implementing Phase 8 of the Milestone P&L Dashboard project. This phase adds construction phase tracking and management functionality to project detail pages, enabling users to organize their projects by standard construction phases (Groundworks, Superstructure, First Fix, Second Fix, Finals) with progress tracking, financial summaries, and webhook integration for n8n synchronization.

## Feature Overview
This phase introduces:
- Phase summary cards showing financial metrics per construction phase
- Manual phase assignment for invoices, bills, and estimates
- Progress tracking with ±5% adjustment buttons
- Grouping toggle to organize items by phase with subtotals
- Webhook integration for real-time n8n synchronization
- Comprehensive audit logging for all phase-related changes

## Pre-Implementation Requirements

### 1. Document Review
First, thoroughly read and understand these documents in this exact order:
1. `/root/projects/milestone-app/docs/033-phase-8-details.md` - Complete technical specification
2. `/root/projects/milestone-app/docs/034-phase-8-tasks.md` - Study all 85 tasks (T335-T419)
3. `/root/projects/milestone-app/docs/035-phase-8-QA.md` - Understand 52 validation requirements (QA356-QA407)
4. Review database schema for existing structure
5. Check `.reference` folder for UI consistency requirements

### 2. Context Building
Before starting implementation:
- Use `mcp__context7__resolve-library-id` and `mcp__context7__get-library-docs` to research:
  - React Server Components patterns
  - Webhook implementation in Next.js
  - Optimistic UI updates
  - Database transaction patterns
  - Audit logging best practices
- Use WebSearch to find:
  - Construction phase management standards (2024)
  - Webhook security best practices
  - Progress tracking UI patterns
  - Financial dashboard components

### 3. Environment Setup
```bash
# Create feature branch
git checkout -b phase-8-construction-phases

# Verify development server running
npm run dev

# Check database connection
npm run db:studio

# Verify n8n webhook endpoint is accessible
curl -X POST http://localhost:5678/webhook-test/phase-update
```

### 4. Critical Understanding
**IMPORTANT**: This phase adds NEW functionality while maintaining existing features:
- All existing project details must continue working
- Phase assignment is optional (items can remain unassigned)
- Grouping toggle must not break existing views
- Webhook failures must not block UI updates

## Implementation Instructions

### Phase 8 Task Execution (T335-T419)

#### CRITICAL RULES:
1. **Complete tasks in order** - Dependencies matter
2. **Test incrementally** - Don't wait until the end
3. **Maintain backwards compatibility** - Existing features must work
4. **Handle edge cases** - Empty phases, null values, etc.

#### Database Setup (T335-T345):

**Add Phase Columns to Tables:**
```sql
-- T335: Add phase_id to invoices
ALTER TABLE invoices ADD COLUMN phase_id VARCHAR(50);
ALTER TABLE invoices ADD COLUMN phase_progress INTEGER DEFAULT 0;

-- T336: Add phase_id to bills
ALTER TABLE bills ADD COLUMN phase_id VARCHAR(50);
ALTER TABLE bills ADD COLUMN phase_progress INTEGER DEFAULT 0;

-- T337: Add phase_id to project_estimates
ALTER TABLE project_estimates ADD COLUMN phase_id VARCHAR(50);

-- T338: Create indexes
CREATE INDEX idx_invoices_phase ON invoices(phase_id);
CREATE INDEX idx_bills_phase ON bills(phase_id);
CREATE INDEX idx_estimates_phase ON project_estimates(phase_id);
```

**Create Build Phases Table:**
```sql
-- T339: Create table
CREATE TABLE build_phases (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER,
  color VARCHAR(7),
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- T340: Insert default phases
INSERT INTO build_phases (id, name, sort_order, color, icon) VALUES
('groundworks', 'Groundworks', 1, '#8B4513', 'Shovel'),
('superstructure', 'Superstructure', 2, '#708090', 'Building2'),
('first_fix', 'First Fix', 3, '#4682B4', 'Wrench'),
('second_fix', 'Second Fix', 4, '#32CD32', 'Hammer'),
('finals', 'Finals', 5, '#9370DB', 'CheckSquare'),
('unassigned', 'Unassigned', 999, '#6B7280', 'HelpCircle');
```

**Create Phase Progress Table:**
```sql
-- T341: Track progress per phase per project
CREATE TABLE phase_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(50) NOT NULL,
  phase_id VARCHAR(50) NOT NULL,
  progress_percentage INTEGER DEFAULT 0,
  updated_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, phase_id)
);
```

#### Component Implementation (T346-T360):

**Phase Summary Cards Component:**
```typescript
// T346: src/components/projects/phase-summary-cards.tsx
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Building2, Wrench, Hammer, CheckSquare, HelpCircle, Shovel } from 'lucide-react';

const phaseIcons = {
  groundworks: Shovel,
  superstructure: Building2,
  first_fix: Wrench,
  second_fix: Hammer,
  finals: CheckSquare,
  unassigned: HelpCircle
};

const phaseColors = {
  groundworks: '#8B4513',
  superstructure: '#708090',
  first_fix: '#4682B4',
  second_fix: '#32CD32',
  finals: '#9370DB',
  unassigned: '#6B7280'
};

export function PhaseSummaryCards({ phases }: { phases: PhaseData[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {phases.map((phase) => {
        const Icon = phaseIcons[phase.id] || HelpCircle;
        const color = phaseColors[phase.id] || '#6B7280';

        return (
          <Card key={phase.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" style={{ color }} />
                <h3 className="font-medium">{phase.name}</h3>
                <span className="text-sm text-muted-foreground">
                  ({phase.itemCount} items)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-medium">
                  {formatCurrency(phase.revenue)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Costs</span>
                <span className="font-medium">
                  {formatCurrency(phase.costs)}
                </span>
              </div>

              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">Profit</span>
                <span className={`font-medium ${
                  phase.profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(phase.profit)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Margin</span>
                <span className={`font-medium ${
                  phase.margin >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {phase.margin.toFixed(1)}%
                </span>
              </div>

              <ProgressTracker
                phaseId={phase.id}
                projectId={phase.projectId}
                initialProgress={phase.progress}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
```

**Progress Tracker Component:**
```typescript
// T347: Progress tracking with ±5% buttons
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { updatePhaseProgress } from '@/app/actions/phases';

export function ProgressTracker({
  phaseId,
  projectId,
  initialProgress
}: {
  phaseId: string;
  projectId: string;
  initialProgress: number;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleProgressChange = async (delta: number) => {
    const newProgress = Math.max(0, Math.min(100, progress + delta));
    if (newProgress === progress) return;

    setIsUpdating(true);
    setProgress(newProgress);

    try {
      await updatePhaseProgress(projectId, phaseId, newProgress);
    } catch (error) {
      console.error('Failed to update progress:', error);
      setProgress(progress); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted-foreground">Progress</span>
        <span className="text-sm font-medium">{progress}%</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={() => handleProgressChange(-5)}
          disabled={isUpdating || progress === 0}
        >
          <Minus className="h-3 w-3" />
        </Button>

        <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: phaseColors[phaseId]
            }}
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={() => handleProgressChange(5)}
          disabled={isUpdating || progress === 100}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
```

**Phase Assignment Popover:**
```typescript
// T348: Phase assignment UI
'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';
import { updateItemPhase } from '@/app/actions/phases';

export function PhaseAssignmentPopover({
  itemId,
  itemType,
  currentPhaseId,
  currentProjectId,
  phases,
  projects
}: PhaseAssignmentProps) {
  const [phaseId, setPhaseId] = useState(currentPhaseId);
  const [projectId, setProjectId] = useState(currentProjectId);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateItemPhase({
        itemId,
        itemType,
        phaseId,
        projectId
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update phase:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Assign Phase</h4>
          </div>

          <div className="space-y-2">
            <Label>Construction Phase</Label>
            <select
              className="w-full p-2 border rounded"
              value={phaseId || 'unassigned'}
              onChange={(e) => setPhaseId(e.target.value)}
            >
              {phases.map(phase => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Project</Label>
            <select
              className="w-full p-2 border rounded"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

#### Server Actions (T361-T370):

**Phase Update Actions:**
```typescript
// T361: src/app/actions/phases.ts
'use server';

import { db } from '@/db';
import { invoices, bills, projectEstimates, phaseProgress, auditLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { triggerWebhook } from '@/lib/webhooks';

export async function updateItemPhase({
  itemId,
  itemType,
  phaseId,
  projectId
}: {
  itemId: string;
  itemType: 'invoice' | 'bill' | 'estimate';
  phaseId: string | null;
  projectId: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    // Update the appropriate table
    let table;
    switch (itemType) {
      case 'invoice':
        table = invoices;
        break;
      case 'bill':
        table = bills;
        break;
      case 'estimate':
        table = projectEstimates;
        break;
      default:
        throw new Error('Invalid item type');
    }

    await db.update(table)
      .set({
        phase_id: phaseId,
        updated_at: new Date()
      })
      .where(eq(table.id, itemId));

    // Log the change
    await db.insert(auditLogs).values({
      user_id: userId,
      event_type: 'phase_assignment',
      event_data: JSON.stringify({
        itemId,
        itemType,
        phaseId,
        projectId
      }),
      created_at: new Date()
    });

    // Trigger webhook for n8n
    await triggerWebhook({
      event: 'phase_updated',
      data: {
        itemId,
        itemType,
        phaseId,
        projectId,
        timestamp: new Date().toISOString()
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to update phase:', error);
    throw error;
  }
}

export async function updatePhaseProgress(
  projectId: string,
  phaseId: string,
  progress: number
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    // Upsert progress record
    await db.insert(phaseProgress)
      .values({
        project_id: projectId,
        phase_id: phaseId,
        progress_percentage: progress,
        updated_by: userId,
        updated_at: new Date()
      })
      .onConflictDoUpdate({
        target: [phaseProgress.project_id, phaseProgress.phase_id],
        set: {
          progress_percentage: progress,
          updated_by: userId,
          updated_at: new Date()
        }
      });

    // Log the change
    await db.insert(auditLogs).values({
      user_id: userId,
      event_type: 'progress_update',
      event_data: JSON.stringify({
        projectId,
        phaseId,
        progress
      }),
      created_at: new Date()
    });

    // Trigger webhook
    await triggerWebhook({
      event: 'progress_updated',
      data: {
        projectId,
        phaseId,
        progress,
        timestamp: new Date().toISOString()
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to update progress:', error);
    throw error;
  }
}
```

#### Webhook Integration (T371-T375):

**Webhook Handler:**
```typescript
// T371: src/lib/webhooks.ts
export async function triggerWebhook(payload: WebhookPayload) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('No webhook URL configured');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEBHOOK_SECRET || ''
      },
      body: JSON.stringify({
        ...payload,
        source: 'milestone-app',
        environment: process.env.NODE_ENV
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Webhook error:', error);
    // Don't throw - webhooks should not block UI updates
  }
}
```

#### UI Integration (T376-T385):

**Enhanced Project Tabs:**
```typescript
// T376: Add grouping toggle to project tabs
'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function ProjectTabsEnhanced({
  invoices,
  bills,
  estimates,
  phases
}: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState('invoices');
  const [groupByPhase, setGroupByPhase] = useState(true);

  const renderGroupedItems = (items: any[]) => {
    if (!groupByPhase) {
      return renderChronologicalList(items);
    }

    const grouped = phases.map(phase => {
      const phaseItems = items.filter(item =>
        (item.phase_id || 'unassigned') === phase.id
      );

      if (phaseItems.length === 0) return null;

      const subtotal = phaseItems.reduce((sum, item) =>
        sum + Number(item.total || item.amount || 0), 0
      );

      return (
        <div key={phase.id} className="mb-6">
          <div className="flex items-center justify-between mb-3 p-2 bg-muted rounded">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: phase.color }}
              />
              <h3 className="font-medium">
                {phase.name} ({phaseItems.length})
              </h3>
            </div>
            <span className="font-medium">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="space-y-2">
            {phaseItems.map(item => renderItemRow(item))}
          </div>
        </div>
      );
    }).filter(Boolean);

    return <div>{grouped}</div>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {/* Tab buttons */}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="group-by-phase"
            checked={groupByPhase}
            onCheckedChange={setGroupByPhase}
          />
          <Label htmlFor="group-by-phase">
            Group by Phase
          </Label>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'invoices' && renderGroupedItems(invoices)}
        {activeTab === 'bills' && renderGroupedItems(bills)}
        {activeTab === 'estimates' && renderGroupedItems(estimates)}
      </div>
    </div>
  );
}
```

### Testing & QA (T386-T419):

#### Running QA Validation:
```bash
# Execute all 52 QA items systematically
# Document results for each test
# Fix any failures before proceeding
```

#### Performance Testing:
```javascript
// T390: Add performance monitoring
console.time('PhaseDataLoad');
const phaseData = await getPhaseData(projectId);
console.timeEnd('PhaseDataLoad'); // Should be < 500ms

console.time('PhaseUpdate');
await updateItemPhase(params);
console.timeEnd('PhaseUpdate'); // Should be < 1s
```

#### Cross-Browser Testing:
1. Chrome/Edge - Full feature validation
2. Firefox - Check all UI components
3. Safari - Verify on macOS and iOS
4. Mobile - Test responsive layouts and touch interactions

## Common Pitfalls to Avoid

### Database Issues:
- **DON'T** forget to add indexes for phase_id columns
- **DON'T** allow null project_id when phase_id is set
- **DO** handle migration for existing data

### UI Consistency:
- **DON'T** break existing project detail layouts
- **DON'T** forget dark mode compatibility
- **DO** maintain responsive design

### Performance:
- **DON'T** load all phase data if not needed
- **DON'T** make synchronous webhook calls
- **DO** use optimistic UI updates

### Error Handling:
- **DON'T** let webhook failures block UI
- **DON'T** show technical errors to users
- **DO** provide fallback for missing phases

## Validation Steps

### After Each Component:
1. Test component in isolation
2. Verify data flows correctly
3. Check responsive behavior
4. Test error scenarios
5. Verify dark mode

### Integration Testing:
1. Create test project with mixed data
2. Assign phases to various items
3. Toggle grouping on/off
4. Update progress percentages
5. Verify webhook triggers

### Final Validation Checklist:
- [ ] All 85 tasks complete (T335-T419)
- [ ] All 52 QA items pass (QA356-QA407)
- [ ] Phase cards display correctly
- [ ] Progress tracking works (±5%)
- [ ] Phase assignment saves properly
- [ ] Grouping toggle functions correctly
- [ ] Subtotals calculate accurately
- [ ] Webhooks trigger successfully
- [ ] Audit logs capture all changes
- [ ] Performance meets targets (<2s)
- [ ] Mobile responsive
- [ ] Dark mode compatible
- [ ] Cross-browser tested

## Success Criteria

Phase 8 is complete when:
1. **Phase summary cards** display with correct financial data
2. **Progress tracking** allows ±5% adjustments that persist
3. **Phase assignment** works for all item types
4. **Grouping toggle** correctly organizes and subtotals items
5. **Webhooks** fire on all updates for n8n sync
6. **Audit logging** captures all phase-related changes
7. **All 52 QA items** pass validation
8. **Performance** targets met (<2s page loads)
9. **No regressions** in existing functionality

## Next Steps

After completing Phase 8:
1. Run complete QA suite (QA356-QA407)
2. Performance profiling and optimization
3. Update project documentation
4. Create pull request with detailed description
5. Deploy to staging for user testing
6. Prepare for Phase 9 planning

---

**CRITICAL REMINDER**: This phase adds complex new functionality. Test thoroughly at each step. Ensure backward compatibility. Handle all edge cases. The construction phases feature is central to the project management workflow.

*Estimated Time: 10-12 hours*
*Priority: HIGH - Core feature enhancement*
*Dependencies: Phases 1-7 must be complete*