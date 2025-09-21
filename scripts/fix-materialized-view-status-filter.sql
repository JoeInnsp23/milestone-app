-- Drop and recreate the materialized view to include all projects regardless of is_active
-- This allows us to see both Active and Completed projects in the projects table

DROP MATERIALIZED VIEW IF EXISTS milestone.project_phase_summary;

CREATE MATERIALIZED VIEW milestone.project_phase_summary AS
WITH
-- Invoice summary by project and phase
invoice_summary AS (
  SELECT
    project_id,
    build_phase_id,
    SUM(CASE WHEN type = 'ACCREC' THEN total ELSE 0 END) AS revenue,
    SUM(CASE WHEN type = 'ACCREC' THEN amount_paid ELSE 0 END) AS revenue_paid,
    COUNT(CASE WHEN type = 'ACCREC' THEN 1 END) AS invoice_count
  FROM milestone.invoices
  WHERE status IN ('AUTHORISED', 'PAID')
  GROUP BY project_id, build_phase_id
),
-- Bill summary by project and phase
bill_summary AS (
  SELECT
    project_id,
    build_phase_id,
    SUM(total) AS costs,
    SUM(amount_paid) AS costs_paid,
    COUNT(*) AS bill_count
  FROM milestone.bills
  WHERE status IN ('AUTHORISED', 'PAID')
  GROUP BY project_id, build_phase_id
),
-- Estimate summary by project and phase
estimate_summary AS (
  SELECT
    project_id,
    build_phase_id,
    SUM(CASE WHEN estimate_type = 'revenue' THEN amount ELSE 0 END) AS estimated_revenue,
    SUM(CASE WHEN estimate_type = 'cost' THEN amount ELSE 0 END) AS estimated_cost
  FROM milestone.project_estimates
  WHERE valid_until IS NULL OR valid_until > CURRENT_DATE
  GROUP BY project_id, build_phase_id
)
-- Main query combining all data
SELECT
  p.id AS project_id,
  p.name AS project_name,
  p.client_name,
  p.status AS project_status,
  bp.id AS phase_id,
  bp.name AS phase_name,
  bp.display_order AS phase_order,
  bp.color AS phase_color,
  COALESCE(i.revenue, 0) AS actual_revenue,
  COALESCE(i.revenue_paid, 0) AS revenue_paid,
  COALESCE(b.costs, 0) AS actual_costs,
  COALESCE(b.costs_paid, 0) AS costs_paid,
  COALESCE(i.revenue, 0) - COALESCE(b.costs, 0) AS profit,
  CASE
    WHEN COALESCE(i.revenue, 0) > 0
    THEN (COALESCE(i.revenue, 0) - COALESCE(b.costs, 0)) / i.revenue * 100
    ELSE 0
  END AS profit_margin,
  COALESCE(e.estimated_revenue, 0) AS estimated_revenue,
  COALESCE(e.estimated_cost, 0) AS estimated_cost,
  COALESCE(e.estimated_revenue, 0) - COALESCE(e.estimated_cost, 0) AS estimated_profit,
  COALESCE(i.invoice_count, 0) AS invoice_count,
  COALESCE(b.bill_count, 0) AS bill_count,
  CURRENT_TIMESTAMP AS last_updated
FROM milestone.projects p
CROSS JOIN milestone.build_phases bp
-- Left join to only include phases with actual data
LEFT JOIN (
  SELECT DISTINCT project_id, build_phase_id
  FROM (
    SELECT project_id, build_phase_id FROM milestone.invoices WHERE build_phase_id IS NOT NULL
    UNION
    SELECT project_id, build_phase_id FROM milestone.bills WHERE build_phase_id IS NOT NULL
    UNION
    SELECT project_id, build_phase_id FROM milestone.project_estimates WHERE build_phase_id IS NOT NULL
    UNION
    SELECT project_id, build_phase_id FROM milestone.phase_progress
  ) AS phase_data
) AS active_phases ON p.id = active_phases.project_id AND bp.id = active_phases.build_phase_id
LEFT JOIN invoice_summary i ON i.project_id = p.id AND i.build_phase_id = bp.id
LEFT JOIN bill_summary b ON b.project_id = p.id AND b.build_phase_id = bp.id
LEFT JOIN estimate_summary e ON e.project_id = p.id AND e.build_phase_id = bp.id
WHERE bp.is_active = true;  -- Only filter on build phases being active, not projects

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_project_phase_summary_project ON milestone.project_phase_summary(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phase_summary_phase ON milestone.project_phase_summary(phase_id);