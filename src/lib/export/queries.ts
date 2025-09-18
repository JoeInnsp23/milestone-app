import { db } from '@/db';
import { sql } from 'drizzle-orm';
import type { ProjectWithAggregates, MonthlyMetricsRow, DashboardStats } from '@/types/export';

export async function getProjectExportData(userId: string, projectId?: string) {
  const query = sql`
    SELECT
      p.*,
      pm.revenue,
      pm.costs,
      pm.profit,
      pm.margin,
      pm.invoice_count,
      pm.bill_count,
      pm.last_updated,
      COALESCE(
        JSON_AGG(
          DISTINCT jsonb_build_object(
            'id', i.id,
            'invoice_number', i.invoice_number,
            'invoice_date', i.invoice_date,
            'due_date', i.due_date,
            'total', i.total,
            'status', i.status
          ) ORDER BY i.invoice_date DESC
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'::json
      ) as invoices,
      COALESCE(
        JSON_AGG(
          DISTINCT jsonb_build_object(
            'id', b.id,
            'bill_number', b.bill_number,
            'bill_date', b.bill_date,
            'due_date', b.due_date,
            'total', b.total,
            'status', b.status
          ) ORDER BY b.bill_date DESC
        ) FILTER (WHERE b.id IS NOT NULL),
        '[]'::json
      ) as bills
    FROM projects p
    LEFT JOIN project_metrics pm ON p.id = pm.project_id
    LEFT JOIN invoices i ON p.id = i.project_id
    LEFT JOIN bills b ON p.id = b.project_id
    WHERE p.user_id = ${userId}
    ${projectId ? sql`AND p.id = ${projectId}` : sql``}
    GROUP BY p.id, pm.project_id, pm.revenue, pm.costs, pm.profit, pm.margin,
             pm.invoice_count, pm.bill_count, pm.last_updated
    ORDER BY p.start_date DESC
  `;

  const result = await db.execute(query);
  return {
    rows: result as unknown as ProjectWithAggregates[]
  };
}

export async function getMonthlyMetricsExport(userId: string, months = 12) {
  const query = sql`
    WITH monthly_data AS (
      SELECT
        DATE_TRUNC('month', COALESCE(i.invoice_date, b.bill_date)) as month,
        SUM(i.total) as revenue,
        SUM(b.total) as costs,
        COUNT(DISTINCT p.id) as project_count
      FROM projects p
      LEFT JOIN invoices i ON p.id = i.project_id
      LEFT JOIN bills b ON p.id = b.project_id
      WHERE p.user_id = ${userId}
        AND (i.invoice_date >= CURRENT_DATE - INTERVAL '${sql.raw(months.toString())} months'
             OR b.bill_date >= CURRENT_DATE - INTERVAL '${sql.raw(months.toString())} months')
      GROUP BY DATE_TRUNC('month', COALESCE(i.invoice_date, b.bill_date))
      ORDER BY month DESC
    )
    SELECT
      month,
      COALESCE(revenue, 0) as revenue,
      COALESCE(costs, 0) as costs,
      COALESCE(revenue, 0) - COALESCE(costs, 0) as profit,
      CASE
        WHEN COALESCE(revenue, 0) > 0 THEN
          (COALESCE(revenue, 0) - COALESCE(costs, 0)) / COALESCE(revenue, 0)
        ELSE 0
      END as margin,
      project_count
    FROM monthly_data
    WHERE month IS NOT NULL
  `;

  const result = await db.execute(query);
  return {
    rows: result as unknown as MonthlyMetricsRow[]
  };
}

export async function getDashboardExportData(userId: string) {
  const statsQuery = sql`
    SELECT
      COUNT(DISTINCT p.id) as total_projects,
      SUM(pm.revenue) as total_revenue,
      SUM(pm.costs) as total_costs,
      SUM(pm.profit) as total_profit,
      COUNT(DISTINCT CASE WHEN pm.profit > 0 THEN p.id END) as profitable_projects
    FROM projects p
    LEFT JOIN project_metrics pm ON p.id = pm.project_id
    WHERE p.user_id = ${userId}
  `;

  const statsResult = await db.execute(statsQuery);
  const statsRows = statsResult as unknown as DashboardStats[];
  const projectsResult = await getProjectExportData(userId);
  const monthlyResult = await getMonthlyMetricsExport(userId, 12);

  return {
    stats: statsRows?.[0],
    projects: projectsResult.rows || [],
    monthlyData: monthlyResult.rows || []
  };
}

export async function getProjectsPaginated(userId: string, offset: number, limit: number) {
  const query = sql`
    SELECT
      p.*,
      pm.revenue,
      pm.costs,
      pm.profit,
      pm.margin
    FROM projects p
    LEFT JOIN project_metrics pm ON p.id = pm.project_id
    WHERE p.user_id = ${userId}
    ORDER BY p.start_date DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const result = await db.execute(query);
  return result as unknown as ProjectWithAggregates[];
}