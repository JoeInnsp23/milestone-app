import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { desc, eq, and, isNull } from 'drizzle-orm';
import { subMonths, subYears, subDays } from 'date-fns';
import { unstable_cache } from 'next/cache';
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

// Internal implementation
async function _getDashboardStats() {
  try {
    const stats = await db.execute(sql`
    WITH revenue_data AS (
      SELECT
        COALESCE(SUM(CASE WHEN type = 'ACCREC' THEN total ELSE 0 END), 0) as total_revenue,
        COUNT(CASE WHEN status = 'AUTHORISED' AND amount_due > 0 THEN 1 END) as pending_invoices,
        COUNT(CASE WHEN status = 'AUTHORISED' AND due_date < CURRENT_DATE THEN 1 END) as overdue_invoices,
        MIN(invoice_date) as min_invoice_date,
        MAX(invoice_date) as max_invoice_date
      FROM milestone.invoices
      WHERE status IN ('AUTHORISED', 'PAID')
    ),
    cost_data AS (
      SELECT
        COALESCE(SUM(total), 0) as total_costs,
        MIN(bill_date) as min_bill_date,
        MAX(bill_date) as max_bill_date
      FROM milestone.bills
      WHERE status IN ('AUTHORISED', 'PAID')
    ),
    project_data AS (
      SELECT COUNT(*) as active_projects
      FROM milestone.projects
      WHERE is_active = true
    )
    SELECT
      r.total_revenue,
      c.total_costs,
      r.total_revenue - c.total_costs as total_profit,
      CASE
        WHEN r.total_revenue > 0
        THEN ((r.total_revenue - c.total_costs) / r.total_revenue * 100)
        ELSE 0
      END as profit_margin,
      p.active_projects,
      r.pending_invoices,
      r.overdue_invoices,
      LEAST(r.min_invoice_date, c.min_bill_date) as date_from,
      GREATEST(r.max_invoice_date, c.max_bill_date) as date_to,
      'Company Ltd' as company_name
    FROM revenue_data r, cost_data c, project_data p
  `);

  const lastSync = await db
    .select({ completed_at: syncStatus.completed_at })
    .from(syncStatus)
    .where(eq(syncStatus.status, 'COMPLETED'))
    .orderBy(desc(syncStatus.completed_at))
    .limit(1);

  const rawResult = stats && stats.length > 0 ? stats[0] as Record<string, unknown> : {
    total_revenue: '0',
    total_costs: '0',
    total_profit: '0',
    profit_margin: '0',
    active_projects: '0',
    pending_invoices: '0',
    overdue_invoices: '0',
    date_from: null,
    date_to: null,
    company_name: 'Company Ltd'
  };

  // Convert decimal strings to numbers
  const result = {
    total_revenue: parseFloat(String(rawResult.total_revenue || '0')),
    total_costs: parseFloat(String(rawResult.total_costs || '0')),
    total_profit: parseFloat(String(rawResult.total_profit || '0')),
    profit_margin: parseFloat(String(rawResult.profit_margin || '0')),
    active_projects: parseInt(String(rawResult.active_projects || '0')),
    pending_invoices: parseInt(String(rawResult.pending_invoices || '0')),
    overdue_invoices: parseInt(String(rawResult.overdue_invoices || '0')),
    date_from: rawResult.date_from,
    date_to: rawResult.date_to,
    company_name: rawResult.company_name
  };

  return {
    ...result,
    last_sync_time: lastSync[0]?.completed_at || null,
  };
  } catch (error) {
    console.error('Error fetching dashboard stats:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error,
      stack: error instanceof Error ? error.stack : undefined
    });
    // Return fallback data
    return {
      total_revenue: 0,
      total_costs: 0,
      total_profit: 0,
      profit_margin: 0,
      active_projects: 0,
      pending_invoices: 0,
      overdue_invoices: 0,
      date_from: null,
      date_to: null,
      company_name: 'Dashboard',
      last_sync_time: null
    };
  }
}

// Cached version with 10-second revalidation for better data freshness
export const getDashboardStats = unstable_cache(
  _getDashboardStats,
  ['dashboard-stats'],
  { revalidate: 10 }
);

// Get project summary from materialized view
export async function getProjectSummaries() {
  try {
    const summaries = await db.execute(sql`
      SELECT * FROM milestone.project_phase_summary
      ORDER BY project_name, phase_order
    `);

    // Convert decimal strings to numbers for calculations
    // We use parseFloat here since these values will be used in the UI
    return (summaries || []).map((row: Record<string, unknown>) => ({
      project_id: row.project_id as string,
      project_name: row.project_name as string,
      client_name: row.client_name as string | null,
      project_status: row.project_status as string | null,
      phase_id: row.phase_id as string | null,
      phase_name: row.phase_name as string | null,
      phase_order: row.phase_order as number | null,
      actual_revenue: parseFloat((row.actual_revenue as string) || '0'),
      revenue_paid: parseFloat((row.revenue_paid as string) || '0'),
      actual_costs: parseFloat((row.actual_costs as string) || '0'),
      costs_paid: parseFloat((row.costs_paid as string) || '0'),
      profit: parseFloat((row.profit as string) || '0'),
      profit_margin: parseFloat((row.profit_margin as string) || '0'),
      estimated_revenue: parseFloat((row.estimated_revenue as string) || '0'),
      estimated_cost: parseFloat((row.estimated_cost as string) || '0'),
      invoice_count: parseInt((row.invoice_count as string) || '0'),
      bill_count: parseInt((row.bill_count as string) || '0')
    }));
  } catch (error) {
    console.error('Error fetching project summaries:', error);
    return [];
  }
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
  await db.execute(sql`SELECT milestone.refresh_summary()`);
}

// Get monthly revenue data for charts with period calculations
export async function getMonthlyRevenue(period: '1m' | '3m' | '6m' | '1y' | 'all' = '6m') {
  // Calculate yesterday as the end date
  const yesterday = subDays(new Date(), 1);
  const endDate = yesterday.toISOString().split('T')[0];

  let startDate: string;

  if (period === 'all') {
    // For 'all', get the earliest date from invoices and bills
    const earliestDateQuery = `
      SELECT MIN(date) as earliest_date FROM (
        SELECT MIN(invoice_date) as date FROM milestone.invoices WHERE invoice_date IS NOT NULL
        UNION ALL
        SELECT MIN(bill_date) as date FROM milestone.bills WHERE bill_date IS NOT NULL
      ) dates
    `;
    const result = await db.execute(sql.raw(earliestDateQuery));
    startDate = result[0]?.earliest_date ?
      new Date(result[0].earliest_date as string).toISOString().split('T')[0] :
      subYears(yesterday, 2).toISOString().split('T')[0]; // Default to 2 years if no data
  } else {
    // Calculate start date based on period
    const periodMap = {
      '1m': () => subMonths(yesterday, 1),
      '3m': () => subMonths(yesterday, 3),
      '6m': () => subMonths(yesterday, 6),
      '1y': () => subYears(yesterday, 1),
    };
    startDate = periodMap[period]().toISOString().split('T')[0];
  }

  // Use raw SQL string to avoid parameter type inference issues with PostgreSQL
  const query = `
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', '${startDate}'::date),
        date_trunc('month', '${endDate}'::date),
        '1 month'::interval
      )::date as month
    ),
    invoice_data AS (
      SELECT
        date_trunc('month', invoice_date)::date as month,
        SUM(CASE WHEN type = 'ACCREC' THEN total ELSE 0 END) as revenue
      FROM milestone.invoices
      WHERE status IN ('AUTHORISED', 'PAID')
        AND invoice_date >= '${startDate}'::date
        AND invoice_date <= '${endDate}'::date
      GROUP BY date_trunc('month', invoice_date)
    ),
    bill_data AS (
      SELECT
        date_trunc('month', bill_date)::date as month,
        SUM(total) as costs
      FROM milestone.bills
      WHERE status IN ('AUTHORISED', 'PAID')
        AND bill_date >= '${startDate}'::date
        AND bill_date <= '${endDate}'::date
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
  `;

  const monthlyData = await db.execute(sql.raw(query));

  // Convert decimal strings to numbers
  return (monthlyData || []).map((row: Record<string, unknown>) => ({
    month: row.month as string,
    revenue: parseFloat((row.revenue as string) || '0'),
    costs: parseFloat((row.costs as string) || '0'),
    profit: parseFloat((row.profit as string) || '0')
  }));
}

// Calculate period-over-period metrics
export async function getPeriodMetrics() {
  const currentPeriodStart = subMonths(new Date(), 1).toISOString().split('T')[0];
  const previousPeriodStart = subMonths(new Date(), 2).toISOString().split('T')[0];
  const previousPeriodEnd = subMonths(new Date(), 1).toISOString().split('T')[0];

  const query = `
    WITH current_period AS (
      SELECT
        COALESCE(SUM(CASE WHEN i.type = 'ACCREC' THEN i.total ELSE 0 END), 0) as revenue,
        COALESCE(SUM(b.total), 0) as costs
      FROM milestone.projects p
      LEFT JOIN milestone.invoices i ON p.id = i.project_id
        AND i.invoice_date >= '${currentPeriodStart}'::date
        AND i.status IN ('AUTHORISED', 'PAID')
      LEFT JOIN milestone.bills b ON p.id = b.project_id
        AND b.bill_date >= '${currentPeriodStart}'::date
        AND b.status IN ('AUTHORISED', 'PAID')
    ),
    previous_period AS (
      SELECT
        COALESCE(SUM(CASE WHEN i.type = 'ACCREC' THEN i.total ELSE 0 END), 0) as revenue,
        COALESCE(SUM(b.total), 0) as costs
      FROM milestone.projects p
      LEFT JOIN milestone.invoices i ON p.id = i.project_id
        AND i.invoice_date >= '${previousPeriodStart}'::date
        AND i.invoice_date < '${previousPeriodEnd}'::date
        AND i.status IN ('AUTHORISED', 'PAID')
      LEFT JOIN milestone.bills b ON p.id = b.project_id
        AND b.bill_date >= '${previousPeriodStart}'::date
        AND b.bill_date < '${previousPeriodEnd}'::date
        AND b.status IN ('AUTHORISED', 'PAID')
    )
    SELECT
      c.revenue as current_revenue,
      c.costs as current_costs,
      c.revenue - c.costs as current_profit,
      p.revenue as previous_revenue,
      p.costs as previous_costs,
      p.revenue - p.costs as previous_profit,
      CASE
        WHEN p.revenue > 0 THEN ((c.revenue - p.revenue) / p.revenue * 100)
        ELSE 0
      END as revenue_change_pct,
      CASE
        WHEN (p.revenue - p.costs) != 0
        THEN (((c.revenue - c.costs) - (p.revenue - p.costs)) / ABS(p.revenue - p.costs) * 100)
        ELSE 0
      END as profit_change_pct
    FROM current_period c, previous_period p
  `;

  const result = await db.execute(sql.raw(query));
  return result[0] || {
    current_revenue: 0,
    current_costs: 0,
    current_profit: 0,
    previous_revenue: 0,
    previous_costs: 0,
    previous_profit: 0,
    revenue_change_pct: 0,
    profit_change_pct: 0
  };
}

// Get top projects by profitability
export async function getTopProjects(limit: number = 10) {
  try {
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
  `);

  // Convert decimal strings to numbers
  return (projects || []).map((row: Record<string, unknown>) => ({
    ...row,
    total_revenue: parseFloat((row.total_revenue as string) || '0'),
    total_costs: parseFloat((row.total_costs as string) || '0'),
    total_profit: parseFloat((row.total_profit as string) || '0'),
    avg_margin: parseFloat((row.avg_margin as string) || '0')
  }));
  } catch (error) {
    console.error('Error fetching top projects:', error);
    return [];
  }
}

// Get phase progress for top projects
export async function getTopProjectsPhaseProgress(limit: number = 3) {
  try {
    // First get top projects by profit
    const topProjects = await db.execute(sql`
      SELECT
        project_id,
        project_name,
        SUM(profit) as total_profit
      FROM milestone.project_phase_summary
      GROUP BY project_id, project_name
      ORDER BY total_profit DESC
      LIMIT ${limit}
    `);

    if (!topProjects || topProjects.length === 0) {
      return [];
    }

    const projectIds = (topProjects as Array<Record<string, unknown>>).map(p => p.project_id as string);

    // Get phase progress for these projects
    const phaseProgress = await db.execute(sql`
      SELECT
        pp.project_id,
        p.name as project_name,
        bp.id as phase_id,
        bp.name as phase_name,
        bp.color as phase_color,
        bp.display_order,
        COALESCE(pp.progress_percentage, 0) as progress
      FROM milestone.phase_progress pp
      INNER JOIN milestone.build_phases bp ON pp.build_phase_id = bp.id
      INNER JOIN milestone.projects p ON pp.project_id = p.id
      WHERE pp.project_id = ANY(ARRAY[${sql.raw(projectIds.map(id => `'${id}'`).join(','))}])
        AND pp.progress_percentage > 0
      ORDER BY p.name, bp.display_order
    `);

    // Transform data for chart
    const projectsMap = new Map();

    (phaseProgress as Array<Record<string, unknown>>).forEach(row => {
      const projectId = row.project_id as string;
      const projectName = row.project_name as string;

      if (!projectsMap.has(projectId)) {
        projectsMap.set(projectId, {
          projectId,
          projectName: projectName.length > 15 ? projectName.substring(0, 15) + '...' : projectName,
          phases: []
        });
      }

      projectsMap.get(projectId).phases.push({
        phaseId: row.phase_id as string,
        phaseName: row.phase_name as string,
        color: row.phase_color as string || '#6B7280',
        progress: Number(row.progress || 0),
        displayOrder: Number(row.display_order || 0)
      });
    });

    return Array.from(projectsMap.values());
  } catch (error) {
    console.error('Error fetching project phase progress:', error);
    return [];
  }
}

// Data Validation Queries
export async function validateDashboardData() {
  try {
    // Get actual project count from database
    const actualProjectCount = await db
      .select({ count: sql<number>`COUNT(DISTINCT id)` })
      .from(projects)
      .where(eq(projects.is_active, true));

    // Get displayed stats
    const displayedStats = await getDashboardStats();

    // Compare counts
    const actualCount = Number(actualProjectCount[0]?.count || 0);
    const displayedCount = Number(displayedStats.active_projects || 0);
    const isValid = actualCount === displayedCount;

    if (!isValid) {
      console.error(`DATA MISMATCH: DB has ${actualCount} active projects, displaying ${displayedCount}`);
    }

    return {
      actualProjects: actualCount,
      displayedProjects: displayedCount,
      isValid
    };
  } catch (error) {
    console.error('Error validating dashboard data:', error);
    return {
      actualProjects: 0,
      displayedProjects: 0,
      isValid: false
    };
  }
}

export async function validateFinancialTotals(projectId?: string) {
  try {
    if (projectId) {
      // Validate single project financials
      const projectData = await db.execute(sql`
        SELECT
          p.id,
          COALESCE(SUM(i.total), 0) as actual_revenue,
          COALESCE(SUM(b.total), 0) as actual_costs,
          COALESCE(SUM(i.total), 0) - COALESCE(SUM(b.total), 0) as actual_profit
        FROM milestone.projects p
        LEFT JOIN milestone.invoices i ON p.id = i.project_id AND i.status IN ('AUTHORISED', 'PAID')
        LEFT JOIN milestone.bills b ON p.id = b.project_id AND b.status IN ('AUTHORISED', 'PAID')
        WHERE p.id = ${projectId}
        GROUP BY p.id
      `);

      return projectData[0] || null;
    } else {
      // Validate company-wide financials
      const totals = await db.execute(sql`
        SELECT
          COALESCE(SUM(i.total), 0) as total_revenue,
          COALESCE(SUM(b.total), 0) as total_costs,
          COALESCE(SUM(i.total), 0) - COALESCE(SUM(b.total), 0) as total_profit,
          COUNT(DISTINCT p.id) as project_count
        FROM milestone.projects p
        LEFT JOIN milestone.invoices i ON p.id = i.project_id AND i.status IN ('AUTHORISED', 'PAID')
        LEFT JOIN milestone.bills b ON p.id = b.project_id AND b.status IN ('AUTHORISED', 'PAID')
        WHERE p.is_active = true
      `);

      return totals[0] || null;
    }
  } catch (error) {
    console.error('Error validating financial totals:', error);
    return null;
  }
}