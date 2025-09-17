import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { desc, eq, and, isNull } from 'drizzle-orm';
import {
  projects,
  invoices,
  bills,
  projectEstimates,
  syncStatus,
  userPreferences,
  exportHistory,
  auditLogs,
  buildPhases,
} from '@/db/schema';

// Dashboard queries
export async function getDashboardStats() {
  const stats = await db.execute(sql`
    SELECT
      COALESCE(SUM(CASE WHEN i.type = 'ACCREC' THEN i.total ELSE 0 END), 0) as total_revenue,
      COALESCE(SUM(b.total), 0) as total_costs,
      COALESCE(SUM(CASE WHEN i.type = 'ACCREC' THEN i.total ELSE 0 END), 0) - COALESCE(SUM(b.total), 0) as total_profit,
      CASE
        WHEN COALESCE(SUM(CASE WHEN i.type = 'ACCREC' THEN i.total ELSE 0 END), 0) > 0
        THEN ((COALESCE(SUM(CASE WHEN i.type = 'ACCREC' THEN i.total ELSE 0 END), 0) - COALESCE(SUM(b.total), 0)) /
              COALESCE(SUM(CASE WHEN i.type = 'ACCREC' THEN i.total ELSE 0 END), 1) * 100)
        ELSE 0
      END as profit_margin,
      COUNT(DISTINCT p.id) as active_projects,
      COUNT(CASE WHEN i.status = 'AUTHORISED' AND i.amount_due > 0 THEN 1 END) as pending_invoices,
      COUNT(CASE WHEN i.status = 'AUTHORISED' AND i.due_date < CURRENT_DATE THEN 1 END) as overdue_invoices
    FROM projects p
    LEFT JOIN invoices i ON p.id = i.project_id
    LEFT JOIN bills b ON p.id = b.project_id
    WHERE p.is_active = true
      AND (i.status IN ('AUTHORISED', 'PAID') OR i.status IS NULL)
      AND (b.status IN ('AUTHORISED', 'PAID') OR b.status IS NULL)
  `);

  const lastSync = await db
    .select({ completed_at: syncStatus.completed_at })
    .from(syncStatus)
    .where(eq(syncStatus.status, 'COMPLETED'))
    .orderBy(desc(syncStatus.completed_at))
    .limit(1);

  const result = stats && stats.length > 0 ? stats[0] : {
    total_revenue: 0,
    total_costs: 0,
    total_profit: 0,
    profit_margin: 0,
    active_projects: 0,
    pending_invoices: 0,
    overdue_invoices: 0
  };

  return {
    ...result,
    last_sync_time: lastSync[0]?.completed_at || null,
  };
}

// Get project summary from materialized view
export async function getProjectSummaries() {
  const summaries = await db.execute(sql`
    SELECT * FROM project_phase_summary
    ORDER BY project_name, phase_order
  `);
  return summaries || [];
}

// Get all projects
export async function getProjects(filters?: {
  status?: string;
  client?: string;
  isActive?: boolean;
}) {
  let query = db.select().from(projects);

  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(projects.status, filters.status));
  }
  if (filters?.client) {
    conditions.push(eq(projects.client_name, filters.client));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(projects.is_active, filters.isActive));
  }

  if (conditions.length > 0) {
    // @ts-expect-error - Drizzle types are complex
    query = query.where(and(...conditions));
  }

  return await query.orderBy(desc(projects.created_at));
}

// Get single project with related data
export async function getProjectById(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) return null;

  const projectInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.project_id, projectId))
    .orderBy(desc(invoices.invoice_date));

  const projectBills = await db
    .select()
    .from(bills)
    .where(eq(bills.project_id, projectId))
    .orderBy(desc(bills.bill_date));

  const estimates = await db
    .select()
    .from(projectEstimates)
    .where(
      and(
        eq(projectEstimates.project_id, projectId),
        isNull(projectEstimates.valid_until)
      )
    );

  return {
    ...project,
    invoices: projectInvoices,
    bills: projectBills,
    estimates,
  };
}

// Get invoices by project
export async function getInvoicesByProject(projectId: string) {
  return await db
    .select()
    .from(invoices)
    .where(eq(invoices.project_id, projectId))
    .orderBy(desc(invoices.invoice_date));
}

// Get pending invoices
export async function getPendingInvoices() {
  return await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.status, 'AUTHORISED'),
        sql`${invoices.amount_due} > 0`
      )
    )
    .orderBy(invoices.due_date);
}

// Get overdue invoices
export async function getOverdueInvoices() {
  return await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.status, 'AUTHORISED'),
        sql`${invoices.due_date} < CURRENT_DATE`
      )
    )
    .orderBy(invoices.due_date);
}

// Get bills by project
export async function getBillsByProject(projectId: string) {
  return await db
    .select()
    .from(bills)
    .where(eq(bills.project_id, projectId))
    .orderBy(desc(bills.bill_date));
}

// Get unpaid bills
export async function getUnpaidBills() {
  return await db
    .select()
    .from(bills)
    .where(
      and(
        eq(bills.status, 'AUTHORISED'),
        sql`${bills.amount_due} > 0`
      )
    )
    .orderBy(bills.due_date);
}

// Get or create user preferences
export async function getUserPreferences(userId: string) {
  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.user_id, userId))
    .limit(1);

  if (prefs) return prefs;

  // Create default preferences
  const [newPrefs] = await db
    .insert(userPreferences)
    .values({ user_id: userId })
    .returning();

  return newPrefs;
}

// Update user preferences
export async function updateUserPreferences(
  userId: string,
  updates: Partial<typeof userPreferences.$inferInsert>
) {
  const [updated] = await db
    .update(userPreferences)
    .set(updates)
    .where(eq(userPreferences.user_id, userId))
    .returning();

  return updated;
}

// Estimate CRUD operations
export async function createEstimate(
  estimate: typeof projectEstimates.$inferInsert
) {
  // Invalidate any existing current estimate
  if (!estimate.valid_until) {
    await db
      .update(projectEstimates)
      .set({ valid_until: sql`CURRENT_DATE` })
      .where(
        and(
          eq(projectEstimates.project_id, estimate.project_id),
          estimate.build_phase_id ? eq(projectEstimates.build_phase_id, estimate.build_phase_id) : isNull(projectEstimates.build_phase_id),
          eq(projectEstimates.estimate_type, estimate.estimate_type),
          isNull(projectEstimates.valid_until)
        )
      );
  }

  const [created] = await db
    .insert(projectEstimates)
    .values(estimate)
    .returning();

  // Create audit log
  await createAuditLog({
    event_type: 'estimate_change',
    event_action: 'create',
    entity_id: created.id,
    user_id: estimate.created_by,
    metadata: { project_id: estimate.project_id, estimate_type: estimate.estimate_type },
  });

  return created;
}

export async function updateEstimate(
  id: string,
  updates: Partial<typeof projectEstimates.$inferInsert>,
  userId: string
) {
  const [updated] = await db
    .update(projectEstimates)
    .set({ ...updates, updated_by: userId })
    .where(eq(projectEstimates.id, id))
    .returning();

  // Create audit log
  await createAuditLog({
    event_type: 'estimate_change',
    event_action: 'update',
    entity_id: id,
    user_id: userId,
    metadata: { updates },
  });

  return updated;
}

export async function deleteEstimate(id: string, userId: string) {
  // Soft delete by setting valid_until
  const [deleted] = await db
    .update(projectEstimates)
    .set({ valid_until: sql`CURRENT_DATE` })
    .where(eq(projectEstimates.id, id))
    .returning();

  // Create audit log
  await createAuditLog({
    event_type: 'estimate_change',
    event_action: 'delete',
    entity_id: id,
    user_id: userId,
    metadata: { soft_deleted: true },
  });

  return deleted;
}

// Audit logging
export async function createAuditLog(
  log: typeof auditLogs.$inferInsert
) {
  const [created] = await db
    .insert(auditLogs)
    .values(log)
    .returning();

  return created;
}

// Export history
export async function createExportRecord(
  record: typeof exportHistory.$inferInsert
) {
  const [created] = await db
    .insert(exportHistory)
    .values(record)
    .returning();

  return created;
}

export async function updateExportRecord(
  id: string,
  updates: Partial<typeof exportHistory.$inferInsert>
) {
  const [updated] = await db
    .update(exportHistory)
    .set(updates)
    .where(eq(exportHistory.id, id))
    .returning();

  return updated;
}

// Sync status (read-only)
export async function getLastSyncStatus() {
  const [status] = await db
    .select()
    .from(syncStatus)
    .orderBy(desc(syncStatus.created_at))
    .limit(1);

  return status;
}

export async function getSyncHistory(limit = 10) {
  return await db
    .select()
    .from(syncStatus)
    .orderBy(desc(syncStatus.created_at))
    .limit(limit);
}

// Get all build phases
export async function getBuildPhases() {
  return await db
    .select()
    .from(buildPhases)
    .where(eq(buildPhases.is_active, true))
    .orderBy(buildPhases.display_order);
}

// Refresh materialized view (call after data changes)
export async function refreshDashboardView() {
  await db.execute(sql`SELECT refresh_summary()`);
}