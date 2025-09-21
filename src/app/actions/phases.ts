'use server';

import { db } from '@/db';
import { invoices, bills, projectEstimates, phaseProgress, auditLogs, buildPhases, projects } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { triggerWebhook } from '@/lib/webhooks';

// T370-T374: Progress Update Action
export async function updatePhaseProgress(
  projectId: string,
  buildPhaseId: string,
  progress: number
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    // Get existing progress for audit log
    const existing = await db.select()
      .from(phaseProgress)
      .where(and(
        eq(phaseProgress.project_id, projectId),
        eq(phaseProgress.build_phase_id, buildPhaseId)
      ))
      .limit(1);

    const oldProgress = existing[0]?.progress_percentage || 0;

    // T371: Upsert progress record
    await db.insert(phaseProgress)
      .values({
        project_id: projectId,
        build_phase_id: buildPhaseId,
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

    // T372: Add audit log
    await db.insert(auditLogs).values({
      user_id: userId,
      event_type: 'progress_update',
      event_action: 'update',
      entity_id: `${projectId}_${buildPhaseId}`,
      metadata: {
        projectId,
        buildPhaseId,
        oldProgress,
        newProgress: progress,
        timestamp: new Date().toISOString()
      },
      created_at: new Date()
    });

    // Note: No webhook trigger for progress updates per user requirements
    // Progress changes are local to the dashboard only

    // Revalidate project page
    revalidatePath(`/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to update progress:', error);
    throw error;
  }
}

// T375-T379: Item Phase Assignment Action
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
    let oldPhaseId: string | null = null;

    // T375-T378: Update the appropriate table based on item type
    switch (itemType) {
      case 'invoice': {
        // T376: Update invoice phase
        const existingInvoice = await db.select()
          .from(invoices)
          .where(eq(invoices.id, itemId))
          .limit(1);

        oldPhaseId = existingInvoice[0]?.build_phase_id || null;

        await db.update(invoices)
          .set({
            build_phase_id: phaseId,
            project_id: projectId,
            updated_at: new Date()
          })
          .where(eq(invoices.id, itemId));
        break;
      }

      case 'bill': {
        // T377: Update bill phase
        const existingBill = await db.select()
          .from(bills)
          .where(eq(bills.id, itemId))
          .limit(1);

        oldPhaseId = existingBill[0]?.build_phase_id || null;

        await db.update(bills)
          .set({
            build_phase_id: phaseId,
            project_id: projectId,
            updated_at: new Date()
          })
          .where(eq(bills.id, itemId));
        break;
      }

      case 'estimate': {
        // T378: Update estimate phase
        const existingEstimate = await db.select()
          .from(projectEstimates)
          .where(eq(projectEstimates.id, itemId))
          .limit(1);

        oldPhaseId = existingEstimate[0]?.build_phase_id || null;

        await db.update(projectEstimates)
          .set({
            build_phase_id: phaseId,
            updated_at: new Date(),
            updated_by: userId
          })
          .where(eq(projectEstimates.id, itemId));
        break;
      }

      default:
        throw new Error('Invalid item type');
    }

    // T379: Log the phase assignment change
    await db.insert(auditLogs).values({
      user_id: userId,
      event_type: 'phase_assignment',
      event_action: 'update',
      entity_id: itemId,
      metadata: {
        itemId,
        itemType,
        oldPhaseId,
        newPhaseId: phaseId,
        projectId,
        timestamp: new Date().toISOString()
      },
      created_at: new Date()
    });

    // T380 - Trigger webhook for n8n
    await triggerWebhook({
      event: 'phase_updated',
      data: { itemId, itemType, phaseId, projectId }
    });

    // Revalidate project page
    revalidatePath(`/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to update phase:', error);
    throw error;
  }
}

// Get all available phases
export async function getAllPhases() {
  try {
    const phases = await db.select({
      id: buildPhases.id,
      name: buildPhases.name,
      color: buildPhases.color,
      icon: buildPhases.icon,
      display_order: buildPhases.display_order
    })
    .from(buildPhases)
    .where(eq(buildPhases.is_active, true))
    .orderBy(buildPhases.display_order);

    return phases.map(phase => ({
      ...phase,
      color: phase.color ?? undefined,
      icon: phase.icon ?? undefined,
      display_order: phase.display_order ?? undefined
    }));
  } catch (error) {
    console.error('Failed to get all phases:', error);
    return [];
  }
}

// Get all projects
export async function getAllProjects() {
  try {
    const projectList = await db.select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .where(eq(projects.is_active, true))
    .orderBy(projects.name);

    return projectList;
  } catch (error) {
    console.error('Failed to get all projects:', error);
    return [];
  }
}

// Get phase data for a project
export async function getProjectPhases(projectId: string) {
  try {
    // Get all phases with their progress and financial data
    const phaseSummary = await db.execute(sql`
      SELECT
        bp.id,
        bp.name,
        bp.color,
        bp.icon,
        bp.display_order,
        COALESCE(pp.progress_percentage, 0) as progress,
        COALESCE(inv.revenue, 0) as revenue,
        COALESCE(bil.costs, 0) as costs,
        COALESCE(inv.revenue, 0) - COALESCE(bil.costs, 0) as profit,
        CASE
          WHEN COALESCE(inv.revenue, 0) > 0
          THEN ((COALESCE(inv.revenue, 0) - COALESCE(bil.costs, 0)) / inv.revenue * 100)
          ELSE 0
        END as margin,
        COALESCE(inv.count, 0) + COALESCE(bil.count, 0) + COALESCE(est.count, 0) as item_count,
        COALESCE(inv.count, 0) as invoice_count,
        COALESCE(bil.count, 0) as bill_count,
        COALESCE(est.count, 0) as estimate_count
      FROM milestone.build_phases bp
      LEFT JOIN milestone.phase_progress pp
        ON pp.build_phase_id = bp.id AND pp.project_id = ${projectId}
      LEFT JOIN (
        SELECT
          build_phase_id,
          SUM(total) as revenue,
          COUNT(*) as count
        FROM milestone.invoices
        WHERE project_id = ${projectId}
          AND build_phase_id IS NOT NULL
        GROUP BY build_phase_id
      ) inv ON inv.build_phase_id = bp.id
      LEFT JOIN (
        SELECT
          build_phase_id,
          SUM(total) as costs,
          COUNT(*) as count
        FROM milestone.bills
        WHERE project_id = ${projectId}
          AND build_phase_id IS NOT NULL
        GROUP BY build_phase_id
      ) bil ON bil.build_phase_id = bp.id
      LEFT JOIN (
        SELECT
          build_phase_id,
          COUNT(*) as count
        FROM milestone.project_estimates
        WHERE project_id = ${projectId}
          AND build_phase_id IS NOT NULL
        GROUP BY build_phase_id
      ) est ON est.build_phase_id = bp.id
      WHERE bp.is_active = true
        AND (inv.count > 0 OR bil.count > 0 OR est.count > 0 OR pp.progress_percentage > 0)
      ORDER BY bp.display_order
    `);

    return (phaseSummary as Array<Record<string, unknown>>).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      color: (row.color as string) || '#6B7280',
      icon: (row.icon as string) || 'HelpCircle',
      projectId,
      progress: Number(row.progress || 0),
      revenue: Number(row.revenue || 0),
      costs: Number(row.costs || 0),
      profit: Number(row.profit || 0),
      margin: Number(row.margin || 0),
      itemCount: Number(row.item_count || 0),
      invoiceCount: Number(row.invoice_count || 0),
      billCount: Number(row.bill_count || 0),
      estimateCount: Number(row.estimate_count || 0),
    }));
  } catch (error) {
    console.error('Failed to get project phases:', error);
    return [];
  }
}