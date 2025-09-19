-- Create project_financial_summary materialized view for export functionality
-- Fixed version without user_id column

DROP MATERIALIZED VIEW IF EXISTS milestone.project_financial_summary CASCADE;

CREATE MATERIALIZED VIEW milestone.project_financial_summary AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    p.client_name,
    p.status,
    p.start_date,
    p.end_date,
    -- Aggregate financial metrics
    COALESCE(SUM(i.total), 0)::numeric AS revenue,
    COALESCE(SUM(b.total), 0)::numeric AS costs,
    (COALESCE(SUM(i.total), 0) - COALESCE(SUM(b.total), 0))::numeric AS profit,
    CASE
        WHEN COALESCE(SUM(i.total), 0) > 0
        THEN ((COALESCE(SUM(i.total), 0) - COALESCE(SUM(b.total), 0)) / COALESCE(SUM(i.total), 0) * 100)::numeric
        ELSE 0::numeric
    END AS margin,
    COUNT(DISTINCT i.id)::integer AS invoice_count,
    COUNT(DISTINCT b.id)::integer AS bill_count,
    GREATEST(
        MAX(i.updated_at),
        MAX(b.updated_at),
        MAX(p.updated_at)
    ) AS last_updated
FROM milestone.projects p
LEFT JOIN milestone.invoices i ON p.id = i.project_id
LEFT JOIN milestone.bills b ON p.id = b.project_id
GROUP BY p.id, p.name, p.client_name, p.status, p.start_date, p.end_date;

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