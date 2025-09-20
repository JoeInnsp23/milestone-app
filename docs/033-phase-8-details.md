# Phase 8: Construction Phases Feature Implementation

## Overview
This phase implements a comprehensive construction cost tracking system throughout the Milestone P&L Dashboard. The feature provides detailed phase-based cost tracking with 17 specific construction phases, matching industry-standard build stages used in construction project management. It includes phase-specific summaries replicating Excel tracker functionality, detailed cost tracking tables, float management visualization, progress tracking, and grouping capabilities on project detail pages.

## UI/UX Principles
- **Phase Visibility**: Clear visual distinction between construction phases using unique colors and icons
- **Intuitive Grouping**: Default grouping by phase with easy toggle to chronological view
- **Progress Clarity**: Visual progress bars with percentage displays for each phase
- **Consistent Styling**: Phase cards match existing KPI card design patterns
- **Seamless Integration**: Phase data flows naturally from Xero through n8n to the dashboard

## Prerequisites
- Phases 1-7 completed successfully
- Xero tracking categories configured with construction phases
- n8n webhook infrastructure in place
- Database schema supports phase relationships
- Existing invoices, bills, and estimates tables functional

## Step 1: Database Schema Updates

### 1.1 Update Seed Data with Phases
**File**: `src/db/seed.ts`

```typescript
// Define 17 specific construction phases matching Excel tracker
const constructionPhases = [
  { id: 'BP001', name: 'Demolition Enabling works', display_order: 1, color: '#8B4513', icon: 'Hammer' },
  { id: 'BP002', name: 'Groundworks', display_order: 2, color: '#8B5A2B', icon: 'Shovel' },
  { id: 'BP003', name: 'Masonry', display_order: 3, color: '#A0522D', icon: 'Layers' },
  { id: 'BP004', name: 'Roofing', display_order: 4, color: '#708090', icon: 'Home' },
  { id: 'BP005', name: 'Electrical', display_order: 5, color: '#FFD700', icon: 'Zap' },
  { id: 'BP006', name: 'Plumbing & Heating', display_order: 6, color: '#4682B4', icon: 'Droplets' },
  { id: 'BP007', name: 'Joinery', display_order: 7, color: '#8B7355', icon: 'Hammer' },
  { id: 'BP008', name: 'Windows and doors', display_order: 8, color: '#87CEEB', icon: 'DoorOpen' },
  { id: 'BP009', name: 'Drylining & Plaster/Render', display_order: 9, color: '#F5F5DC', icon: 'PaintRoller' },
  { id: 'BP010', name: 'Decoration', display_order: 10, color: '#9370DB', icon: 'Paintbrush' },
  { id: 'BP011', name: 'Landscaping', display_order: 11, color: '#228B22', icon: 'Trees' },
  { id: 'BP012', name: 'Finishes Schedule', display_order: 12, color: '#DAA520', icon: 'ListChecks' },
  { id: 'BP013', name: 'Steelwork', display_order: 13, color: '#696969', icon: 'HardHat' },
  { id: 'BP014', name: 'Flooring/Tiling', display_order: 14, color: '#D2691E', icon: 'Grid3x3' },
  { id: 'BP015', name: 'Kitchen', display_order: 15, color: '#FF6347', icon: 'ChefHat' },
  { id: 'BP016', name: 'Extra', display_order: 16, color: '#6B7280', icon: 'Plus' },
  { id: 'BP017', name: 'Project Management Fee', display_order: 17, color: '#4B0082', icon: 'Briefcase' }
];
```

### 1.2 Add Phase Progress Tracking
**New Table**: `phase_progress`

```typescript
// src/db/schema.ts
export const phaseProgress = milestone.table(
  'phase_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    project_id: varchar('project_id', { length: 50 })
      .notNull()
      .references(() => projects.id),
    build_phase_id: varchar('build_phase_id', { length: 50 })
      .notNull()
      .references(() => buildPhases.id),
    progress_percentage: integer('progress_percentage').default(0).notNull(),
    last_updated_by: varchar('last_updated_by', { length: 255 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    idx_phase_progress_project: index('idx_phase_progress_project').on(table.project_id),
    ux_phase_progress_unique: uniqueIndex('ux_phase_progress_unique').on(
      table.project_id,
      table.build_phase_id
    ),
  })
);
```

## Step 2: Phase Summary Cards Component

### 2.1 Create Phase Summary Cards
**File**: `src/components/projects/phase-summary-cards.tsx`

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { updatePhaseProgress } from '@/app/actions/phases';

interface PhaseSummary {
  phase_id: string;
  phase_name: string;
  color: string;
  icon: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  progress: number;
  invoice_count: number;
  bill_count: number;
  estimate_count: number;
}

interface PhaseSummaryCardsProps {
  projectId: string;
  phases: PhaseSummary[];
  onProgressUpdate?: (phaseId: string, progress: number) => void;
}

export function PhaseSummaryCards({
  projectId,
  phases,
  onProgressUpdate
}: PhaseSummaryCardsProps) {
  const [progressValues, setProgressValues] = useState<Record<string, number>>(
    phases.reduce((acc, phase) => ({
      ...acc,
      [phase.phase_id]: phase.progress
    }), {})
  );

  const handleProgressChange = async (phaseId: string, delta: number) => {
    const currentProgress = progressValues[phaseId] || 0;
    const newProgress = Math.max(0, Math.min(100, currentProgress + delta));

    setProgressValues(prev => ({
      ...prev,
      [phaseId]: newProgress
    }));

    // Update in database
    await updatePhaseProgress(projectId, phaseId, newProgress);

    if (onProgressUpdate) {
      onProgressUpdate(phaseId, newProgress);
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
    return Icon;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
      {phases.map((phase) => {
        const Icon = getIcon(phase.icon);
        const progress = progressValues[phase.phase_id] || 0;

        return (
          <Card key={phase.phase_id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${phase.color}20` }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: phase.color }}
                    />
                  </div>
                  <CardTitle className="text-sm font-medium">
                    {phase.phase_name}
                  </CardTitle>
                </div>
                <span className="text-xs text-muted-foreground">
                  {phase.invoice_count + phase.bill_count + phase.estimate_count} items
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Revenue</p>
                  <p className="font-semibold">{formatCurrency(phase.revenue)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Costs</p>
                  <p className="font-semibold">{formatCurrency(phase.costs)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Profit</p>
                  <p className={`font-semibold ${phase.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(phase.profit)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Margin</p>
                  <p className={`font-semibold ${phase.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {phase.margin.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-6 w-6"
                    onClick={() => handleProgressChange(phase.phase_id, -5)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Progress
                    value={progress}
                    className="flex-1"
                    style={{
                      '--progress-color': phase.color
                    } as any}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-6 w-6"
                    onClick={() => handleProgressChange(phase.phase_id, 5)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

## Step 3: Phase Assignment UI

### 3.1 Phase Assignment Popover
**File**: `src/components/projects/phase-assignment-popover.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings2 } from 'lucide-react';
import { updateItemPhase } from '@/app/actions/phases';
import { toast } from 'react-hot-toast';

interface PhaseAssignmentProps {
  itemId: string;
  itemType: 'invoice' | 'bill' | 'estimate';
  currentPhaseId?: string;
  currentProjectId?: string;
  phases: Array<{ id: string; name: string; color: string }>;
  projects: Array<{ id: string; name: string }>;
  onUpdate?: () => void;
}

export function PhaseAssignmentPopover({
  itemId,
  itemType,
  currentPhaseId,
  currentProjectId,
  phases,
  projects,
  onUpdate
}: PhaseAssignmentProps) {
  const [open, setOpen] = useState(false);
  const [phaseId, setPhaseId] = useState(currentPhaseId || 'phase-unassigned');
  const [projectId, setProjectId] = useState(currentProjectId || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateItemPhase(itemId, itemType, {
        phaseId,
        projectId
      });

      // Trigger webhook for n8n sync
      await fetch('/api/webhooks/phase-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          itemType,
          phaseId,
          projectId
        })
      });

      toast.success('Phase assignment updated');
      setOpen(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to update phase assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Assign Phase & Project</h4>
            <p className="text-xs text-muted-foreground">
              Changes will sync to Xero on next update
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Phase</label>
              <Select value={phaseId} onValueChange={setPhaseId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: phase.color }}
                        />
                        {phase.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Project</label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

## Step 4: Grouped Items Display with Toggle

### 4.1 Enhanced Project Tabs with Phase Grouping
**File**: `src/components/projects/project-tabs-enhanced.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PhaseAssignmentPopover } from './phase-assignment-popover';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Invoice, Bill, ProjectEstimate } from '@/types';

interface GroupedItems {
  phase_id: string;
  phase_name: string;
  phase_color: string;
  items: Array<Invoice | Bill | ProjectEstimate>;
  subtotal: number;
}

interface ProjectTabsEnhancedProps {
  invoices: Invoice[];
  bills: Bill[];
  estimates: ProjectEstimate[];
  phases: Array<{ id: string; name: string; color: string }>;
  projects: Array<{ id: string; name: string }>;
}

export function ProjectTabsEnhanced({
  invoices,
  bills,
  estimates,
  phases,
  projects
}: ProjectTabsEnhancedProps) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'bills' | 'estimates'>('invoices');
  const [groupByPhase, setGroupByPhase] = useState(true);

  const groupItemsByPhase = (items: any[], type: string) => {
    if (!groupByPhase) {
      // Return single group with all items in chronological order
      return [{
        phase_id: 'all',
        phase_name: 'All Items',
        phase_color: '#6B7280',
        items: items.sort((a, b) => {
          const dateA = new Date(a.invoice_date || a.bill_date || a.created_at);
          const dateB = new Date(b.invoice_date || b.bill_date || b.created_at);
          return dateB.getTime() - dateA.getTime();
        }),
        subtotal: items.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
      }];
    }

    // Group by phase
    const grouped = new Map<string, GroupedItems>();

    // Initialize all phases
    phases.forEach(phase => {
      grouped.set(phase.id, {
        phase_id: phase.id,
        phase_name: phase.name,
        phase_color: phase.color,
        items: [],
        subtotal: 0
      });
    });

    // Add items to their phases
    items.forEach(item => {
      const phaseId = item.build_phase_id || 'phase-unassigned';
      const group = grouped.get(phaseId);
      if (group) {
        group.items.push(item);
        group.subtotal += Number(item.total) || 0;
      }
    });

    // Sort items within each phase chronologically
    grouped.forEach(group => {
      group.items.sort((a, b) => {
        const dateA = new Date(a.invoice_date || a.bill_date || a.created_at);
        const dateB = new Date(b.invoice_date || b.bill_date || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
    });

    // Return non-empty groups
    return Array.from(grouped.values()).filter(g => g.items.length > 0);
  };

  const renderGroupedItems = (groups: GroupedItems[], type: 'invoice' | 'bill' | 'estimate') => {
    return groups.map(group => (
      <div key={group.phase_id} className="mb-6">
        {groupByPhase && (
          <div className="flex items-center justify-between mb-3 pb-2 border-b">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: group.phase_color }}
              />
              <h3 className="font-semibold">{group.phase_name}</h3>
              <span className="text-sm text-muted-foreground">
                ({group.items.length} items)
              </span>
            </div>
            <span className="font-semibold">
              Subtotal: {formatCurrency(group.subtotal)}
            </span>
          </div>
        )}

        <div className="space-y-2">
          {group.items.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-card rounded-lg border"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {type === 'invoice' ? `#${(item as Invoice).invoice_number}` :
                     type === 'bill' ? `Bill: ${(item as Bill).contact_name}` :
                     `Estimate: ${(item as ProjectEstimate).description}`}
                  </span>
                  {!groupByPhase && (
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: `${group.phase_color}20`,
                        color: group.phase_color
                      }}
                    >
                      {phases.find(p => p.id === item.build_phase_id)?.name || 'Unassigned'}
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(item.invoice_date || item.bill_date || item.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-semibold">
                  {formatCurrency(Number(item.total) || 0)}
                </span>
                <PhaseAssignmentPopover
                  itemId={item.id}
                  itemType={type}
                  currentPhaseId={item.build_phase_id}
                  currentProjectId={item.project_id}
                  phases={phases}
                  projects={projects}
                  onUpdate={() => {
                    // Refresh data
                    window.location.reload();
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Financial Details</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              id="group-by-phase"
              checked={groupByPhase}
              onCheckedChange={setGroupByPhase}
            />
            <Label htmlFor="group-by-phase">Group by Phase</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'invoices'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
            onClick={() => setActiveTab('invoices')}
          >
            Invoices ({invoices.length})
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'bills'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
            onClick={() => setActiveTab('bills')}
          >
            Bills ({bills.length})
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'estimates'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
            onClick={() => setActiveTab('estimates')}
          >
            Estimates ({estimates.length})
          </button>
        </div>

        <div className="mt-4">
          {activeTab === 'invoices' &&
            renderGroupedItems(groupItemsByPhase(invoices, 'invoice'), 'invoice')}
          {activeTab === 'bills' &&
            renderGroupedItems(groupItemsByPhase(bills, 'bill'), 'bill')}
          {activeTab === 'estimates' &&
            renderGroupedItems(groupItemsByPhase(estimates, 'estimate'), 'estimate')}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Step 5: Server Actions for Phase Management

### 5.1 Phase Update Actions
**File**: `src/app/actions/phases.ts`

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { invoices, bills, projectEstimates, phaseProgress, auditLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateItemPhase(
  itemId: string,
  itemType: 'invoice' | 'bill' | 'estimate',
  data: {
    phaseId: string;
    projectId?: string;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    // Update the appropriate table
    if (itemType === 'invoice') {
      await db
        .update(invoices)
        .set({
          build_phase_id: data.phaseId,
          project_id: data.projectId,
          updated_at: new Date()
        })
        .where(eq(invoices.id, itemId));
    } else if (itemType === 'bill') {
      await db
        .update(bills)
        .set({
          build_phase_id: data.phaseId,
          project_id: data.projectId,
          updated_at: new Date()
        })
        .where(eq(bills.id, itemId));
    } else if (itemType === 'estimate') {
      await db
        .update(projectEstimates)
        .set({
          build_phase_id: data.phaseId,
          updated_at: new Date()
        })
        .where(eq(projectEstimates.id, itemId));
    }

    // Log the change
    await db.insert(auditLogs).values({
      event_type: 'phase_assignment',
      event_action: 'update',
      entity_id: itemId,
      user_id: userId,
      metadata: {
        itemType,
        phaseId: data.phaseId,
        projectId: data.projectId
      }
    });

    revalidatePath('/projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to update phase:', error);
    throw new Error('Failed to update phase assignment');
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
    // Upsert phase progress
    await db
      .insert(phaseProgress)
      .values({
        project_id: projectId,
        build_phase_id: phaseId,
        progress_percentage: progress,
        last_updated_by: userId,
        updated_at: new Date()
      })
      .onConflictDoUpdate({
        target: [phaseProgress.project_id, phaseProgress.build_phase_id],
        set: {
          progress_percentage: progress,
          last_updated_by: userId,
          updated_at: new Date()
        }
      });

    // Log the change
    await db.insert(auditLogs).values({
      event_type: 'phase_progress',
      event_action: 'update',
      entity_id: `${projectId}-${phaseId}`,
      user_id: userId,
      metadata: {
        projectId,
        phaseId,
        progress
      }
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update progress:', error);
    throw new Error('Failed to update phase progress');
  }
}
```

## Step 6: Webhook Integration for n8n

### 6.1 Webhook Endpoint
**File**: `src/app/api/webhooks/phase-update/route.ts`

```typescript
import { NextResponse } from 'next/server';

// Placeholder webhook for n8n integration
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Log for debugging
    console.log('Phase update webhook received:', body);

    // TODO: Configure actual n8n webhook URL
    const N8N_WEBHOOK_URL = process.env.N8N_PHASE_UPDATE_WEBHOOK_URL;

    if (N8N_WEBHOOK_URL) {
      // Forward to n8n
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...body,
          timestamp: new Date().toISOString(),
          source: 'milestone-app'
        })
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

## Step 7: Update Project Detail Page

### 7.1 Integrate Phase Components
**File**: `src/app/(authenticated)/projects/[id]/page.tsx`

```typescript
// Add to imports
import { PhaseSummaryCards } from '@/components/projects/phase-summary-cards';
import { ProjectTabsEnhanced } from '@/components/projects/project-tabs-enhanced';
import { getProjectPhases } from '@/lib/queries';

// In the component, after fetching project data:
const phaseSummaries = await getProjectPhases(project.id);
const allPhases = await getAllPhases();
const allProjects = await getAllProjects();

// In the return statement, add phase cards before KPI cards:
<PhaseSummaryCards
  projectId={project.id}
  phases={phaseSummaries}
/>

// Replace existing ProjectTabs with:
<ProjectTabsEnhanced
  invoices={project.invoices}
  bills={project.bills}
  estimates={project.estimates || []}
  phases={allPhases}
  projects={allProjects}
/>
```

## Step 8: Query Functions for Phase Data

### 8.1 Phase Query Functions
**File**: `src/lib/queries.ts`

```typescript
// Add phase-related queries
export async function getProjectPhases(projectId: string) {
  const phases = await db
    .select({
      phase_id: buildPhases.id,
      phase_name: buildPhases.name,
      color: buildPhases.color,
      icon: buildPhases.icon,
      revenue: sql<number>`
        COALESCE(SUM(CASE
          WHEN i.type = 'ACCREC'
          THEN CAST(i.total AS DECIMAL)
          ELSE 0
        END), 0)
      `.as('revenue'),
      costs: sql<number>`
        COALESCE(SUM(CAST(b.total AS DECIMAL)), 0)
      `.as('costs'),
      invoice_count: sql<number>`COUNT(DISTINCT i.id)`,
      bill_count: sql<number>`COUNT(DISTINCT b.id)`,
      estimate_count: sql<number>`COUNT(DISTINCT e.id)`,
      progress: sql<number>`COALESCE(pp.progress_percentage, 0)`
    })
    .from(buildPhases)
    .leftJoin(invoices as i, and(
      eq(i.build_phase_id, buildPhases.id),
      eq(i.project_id, projectId)
    ))
    .leftJoin(bills as b, and(
      eq(b.build_phase_id, buildPhases.id),
      eq(b.project_id, projectId)
    ))
    .leftJoin(projectEstimates as e, and(
      eq(e.build_phase_id, buildPhases.id),
      eq(e.project_id, projectId)
    ))
    .leftJoin(phaseProgress as pp, and(
      eq(pp.build_phase_id, buildPhases.id),
      eq(pp.project_id, projectId)
    ))
    .where(eq(buildPhases.is_active, true))
    .groupBy(buildPhases.id, pp.progress_percentage)
    .orderBy(buildPhases.display_order);

  return phases.map(phase => ({
    ...phase,
    profit: phase.revenue - phase.costs,
    margin: phase.revenue > 0 ? ((phase.revenue - phase.costs) / phase.revenue) * 100 : 0
  }));
}

export async function getAllPhases() {
  return await db
    .select({
      id: buildPhases.id,
      name: buildPhases.name,
      color: buildPhases.color
    })
    .from(buildPhases)
    .where(eq(buildPhases.is_active, true))
    .orderBy(buildPhases.display_order);
}
```

## Step 9: Float Summary Card Implementation

### 9.1 Float Summary Card Component
**File**: `src/components/projects/float-summary-card.tsx`

This card displays float (customer advance payment) utilization for the project, showing how much float has been received vs. how much has been spent.

Key features:
- Total float received from customer
- Total costs paid to date
- Float balance (positive or negative)
- Visual utilization percentage with color coding
- Integrates with existing KPI card layout

## Step 10: Phase Summary Tab Implementation

### 10.1 Phase Summary Table Component
**File**: `src/components/projects/phase-summary-table.tsx`

This component replicates the Excel tracker's summary sheet format, displaying all construction phases with their financial metrics in a table format.

Columns:
- Build Stage (phase name)
- Estimated Cost (from estimates)
- Total Cost Paid to Date (from bills marked as paid)
- Costs Due (from bills not yet paid)
- Variance to Estimate (difference between estimated and actual)
- Float Balance (displayed only on total row)

Features:
- All 17 construction phases displayed in order
- Automatic calculation of totals
- Color-coded variance (green for under budget, red for over)
- Responsive table with horizontal scroll on mobile

## Step 11: Cost Tracker Tab Implementation

### 11.1 Cost Tracker Table Component
**File**: `src/components/projects/cost-tracker-table.tsx`

This component provides detailed line-item tracking grouped by construction phase, matching the Excel tracker's detailed view.

Features:
- Groups all invoices and bills by their assigned phase
- Collapsible/expandable phase sections
- Shows subtotals for each phase
- Displays: Date, Invoice Reference, Description, Amount Paid, Direct By Customer, Refunds, Costs Due
- Sortable by date or phase
- Export capability to Excel format

### 11.2 Enhanced Project Tabs
**File**: `src/components/projects/project-tabs.tsx`

Update the existing tabs component to include the new Summary and Cost Tracker tabs:
- **Summary** - Phase summary table view
- **Cost Tracker** - Detailed cost tracking view
- **Invoices** - Existing invoices tab
- **Bills** - Existing bills tab
- **Estimates** - Existing estimates tab

## Testing & Validation

### Test Scenarios
1. **Phase Assignment**: Verify items can be assigned to different phases
2. **Progress Tracking**: Test +/- buttons update progress in 5% increments
3. **Grouping Toggle**: Ensure toggle switches between grouped and chronological views
4. **Subtotals**: Verify subtotals calculate correctly for each phase
5. **Unassigned Items**: Check items without phases appear in "Unassigned" group
6. **Webhook Trigger**: Confirm webhook fires on phase updates
7. **Audit Logging**: Verify all changes are logged
8. **Visual Consistency**: Ensure phase cards match existing KPI card styling

## Success Criteria
- [ ] All invoices, bills, and estimates can be assigned to phases
- [ ] Phase summary cards display accurate revenue, costs, and margins
- [ ] Progress bars update smoothly with +/- controls
- [ ] Group by phase toggle works correctly with proper subtotals
- [ ] Phase assignments trigger n8n webhook
- [ ] All changes are audit logged
- [ ] Visual design is consistent with existing dashboard
- [ ] Performance remains fast with large datasets