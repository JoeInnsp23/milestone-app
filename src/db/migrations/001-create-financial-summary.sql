-- Create project_financial_summary materialized view for export functionality
-- This aggregates financial data at the project level for fast queries

DROP MATERIALIZED VIEW IF EXISTS milestone.project_financial_summary CASCADE;

CREATE MATERIALIZED VIEW milestone.project_financial_summary AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    p.client_name,
    p.status,
    p.user_id,
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
GROUP BY p.id, p.name, p.client_name, p.status, p.user_id, p.start_date, p.end_date;

-- Create unique index for CONCURRENTLY refresh capability
CREATE UNIQUE INDEX idx_project_financial_summary_project_id
ON milestone.project_financial_summary (project_id);

-- Create additional indexes for query performance
CREATE INDEX idx_project_financial_summary_user_id
ON milestone.project_financial_summary (user_id);

CREATE INDEX idx_project_financial_summary_status
ON milestone.project_financial_summary (status);

-- Grant permissions
GRANT SELECT ON milestone.project_financial_summary TO milestone_user;

-- Function to refresh both materialized views
CREATE OR REPLACE FUNCTION milestone.refresh_financial_summaries()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Use CONCURRENTLY to avoid locking reads during refresh
    REFRESH MATERIALIZED VIEW CONCURRENTLY milestone.project_financial_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY milestone.project_phase_summary;

    -- Log the refresh
    RAISE NOTICE 'Financial summaries refreshed at %', NOW();
END;
$$;

-- Trigger function that will be called when data changes
CREATE OR REPLACE FUNCTION milestone.trigger_refresh_summaries()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Use pg_notify to signal that a refresh is needed
    -- This allows async processing without blocking the transaction
    PERFORM pg_notify('refresh_summaries', json_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'time', NOW()
    )::text);

    -- For immediate consistency in critical operations,
    -- we can optionally refresh synchronously (commented out by default)
    -- PERFORM milestone.refresh_financial_summaries();

    RETURN NEW;
END;
$$;

-- Create triggers on source tables to auto-refresh materialized views
DROP TRIGGER IF EXISTS refresh_summaries_on_invoice_change ON milestone.invoices;
CREATE TRIGGER refresh_summaries_on_invoice_change
AFTER INSERT OR UPDATE OR DELETE ON milestone.invoices
FOR EACH STATEMENT
EXECUTE FUNCTION milestone.trigger_refresh_summaries();

DROP TRIGGER IF EXISTS refresh_summaries_on_bill_change ON milestone.bills;
CREATE TRIGGER refresh_summaries_on_bill_change
AFTER INSERT OR UPDATE OR DELETE ON milestone.bills
FOR EACH STATEMENT
EXECUTE FUNCTION milestone.trigger_refresh_summaries();

DROP TRIGGER IF EXISTS refresh_summaries_on_project_change ON milestone.projects;
CREATE TRIGGER refresh_summaries_on_project_change
AFTER INSERT OR UPDATE OR DELETE ON milestone.projects
FOR EACH STATEMENT
EXECUTE FUNCTION milestone.trigger_refresh_summaries();

-- Initial population of the materialized view
REFRESH MATERIALIZED VIEW milestone.project_financial_summary;

-- Add comment for documentation
COMMENT ON MATERIALIZED VIEW milestone.project_financial_summary IS
'Aggregated financial summary per project. Auto-refreshes when invoices, bills, or projects change. Used for dashboard and export functionality.';