-- Create project_financial_summary materialized view for export functionality
-- Fixed version without user_id column

DROP MATERIALIZED VIEW IF EXISTS milestone.project_financial_summary CASCADE;

CREATE MATERIALIZED VIEW milestone.project_financial_summary AS
WITH project_revenue AS (
    SELECT
        project_id,
        COALESCE(SUM(total), 0)::numeric AS revenue,
        COUNT(*)::integer AS invoice_count,
        MAX(updated_at) AS last_invoice_update
    FROM milestone.invoices
    GROUP BY project_id
),
project_costs AS (
    SELECT
        project_id,
        COALESCE(SUM(total), 0)::numeric AS costs,
        COUNT(*)::integer AS bill_count,
        MAX(updated_at) AS last_bill_update
    FROM milestone.bills
    GROUP BY project_id
)
SELECT
    p.id AS project_id,
    p.name AS project_name,
    p.client_name,
    p.status,
    p.start_date,
    p.end_date,
    -- Aggregate financial metrics
    COALESCE(pr.revenue, 0)::numeric AS revenue,
    COALESCE(pc.costs, 0)::numeric AS costs,
    (COALESCE(pr.revenue, 0) - COALESCE(pc.costs, 0))::numeric AS profit,
    CASE
        WHEN COALESCE(pr.revenue, 0) > 0
        THEN ((COALESCE(pr.revenue, 0) - COALESCE(pc.costs, 0)) / COALESCE(pr.revenue, 0) * 100)::numeric
        ELSE 0::numeric
    END AS margin,
    COALESCE(pr.invoice_count, 0) AS invoice_count,
    COALESCE(pc.bill_count, 0) AS bill_count,
    GREATEST(
        pr.last_invoice_update,
        pc.last_bill_update,
        p.updated_at
    ) AS last_updated
FROM milestone.projects p
LEFT JOIN project_revenue pr ON p.id = pr.project_id
LEFT JOIN project_costs pc ON p.id = pc.project_id;

-- Create unique index for CONCURRENTLY refresh capability
CREATE UNIQUE INDEX idx_project_financial_summary_project_id
ON milestone.project_financial_summary (project_id);

-- Create additional indexes for query performance
CREATE INDEX idx_project_financial_summary_status
ON milestone.project_financial_summary (status);

-- Grant permissions
GRANT SELECT ON milestone.project_financial_summary TO milestone_user;

-- Initial population of the materialized view
REFRESH MATERIALIZED VIEW milestone.project_financial_summary;

-- Add comment for documentation
COMMENT ON MATERIALIZED VIEW milestone.project_financial_summary IS
'Aggregated financial summary per project. Auto-refreshes when invoices, bills, or projects change. Used for dashboard and export functionality.';