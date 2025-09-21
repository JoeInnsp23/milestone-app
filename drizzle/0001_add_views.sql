-- Add materialized views and improvements to the base schema
-- This file should be run after the main schema migration

-- 1. Create project_financial_summary materialized view
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

-- 2. Create project_phase_summary materialized view
DROP MATERIALIZED VIEW IF EXISTS milestone.project_phase_summary CASCADE;

CREATE MATERIALIZED VIEW milestone.project_phase_summary AS
WITH invoice_summary AS (
    SELECT
        project_id,
        build_phase_id,
        SUM(CASE WHEN type = 'ACCREC' THEN total ELSE 0 END) as revenue,
        SUM(CASE WHEN type = 'ACCREC' THEN amount_paid ELSE 0 END) as revenue_paid,
        COUNT(CASE WHEN type = 'ACCREC' THEN 1 ELSE NULL END) as invoice_count
    FROM milestone.invoices
    WHERE status IN ('AUTHORISED', 'PAID')
    GROUP BY project_id, build_phase_id
),
bill_summary AS (
    SELECT
        project_id,
        build_phase_id,
        SUM(total) as costs,
        SUM(amount_paid) as costs_paid,
        COUNT(*) as bill_count
    FROM milestone.bills
    WHERE status IN ('AUTHORISED', 'PAID')
    GROUP BY project_id, build_phase_id
),
estimate_summary AS (
    SELECT
        project_id,
        build_phase_id,
        SUM(CASE WHEN estimate_type = 'revenue' THEN amount ELSE 0 END) as estimated_revenue,
        SUM(CASE WHEN estimate_type = 'cost' THEN amount ELSE 0 END) as estimated_cost
    FROM milestone.project_estimates
    WHERE valid_until IS NULL OR valid_until > CURRENT_DATE
    GROUP BY project_id, build_phase_id
)
SELECT
    p.id as project_id,
    p.name as project_name,
    p.client_name,
    p.status as project_status,
    bp.id as phase_id,
    bp.name as phase_name,
    bp.display_order as phase_order,
    bp.color as phase_color,
    COALESCE(i.revenue, 0) as actual_revenue,
    COALESCE(i.revenue_paid, 0) as revenue_paid,
    COALESCE(b.costs, 0) as actual_costs,
    COALESCE(b.costs_paid, 0) as costs_paid,
    COALESCE(i.revenue, 0) - COALESCE(b.costs, 0) as profit,
    CASE
        WHEN COALESCE(i.revenue, 0) > 0
        THEN ((COALESCE(i.revenue, 0) - COALESCE(b.costs, 0)) / i.revenue * 100)
        ELSE 0
    END as profit_margin,
    COALESCE(e.estimated_revenue, 0) as estimated_revenue,
    COALESCE(e.estimated_cost, 0) as estimated_cost,
    COALESCE(e.estimated_revenue, 0) - COALESCE(e.estimated_cost, 0) as estimated_profit,
    COALESCE(i.invoice_count, 0) as invoice_count,
    COALESCE(b.bill_count, 0) as bill_count,
    CURRENT_TIMESTAMP as last_updated
FROM milestone.projects p
CROSS JOIN milestone.build_phases bp
LEFT JOIN (
    -- Get actual phase data where it exists
    SELECT DISTINCT project_id, build_phase_id
    FROM (
        SELECT project_id, build_phase_id FROM milestone.invoices WHERE build_phase_id IS NOT NULL
        UNION
        SELECT project_id, build_phase_id FROM milestone.bills WHERE build_phase_id IS NOT NULL
        UNION
        SELECT project_id, build_phase_id FROM milestone.project_estimates WHERE build_phase_id IS NOT NULL
        UNION
        SELECT project_id, build_phase_id FROM milestone.phase_progress
    ) phase_data
) active_phases ON p.id = active_phases.project_id AND bp.id = active_phases.build_phase_id
LEFT JOIN invoice_summary i ON i.project_id = p.id AND i.build_phase_id = bp.id
LEFT JOIN bill_summary b ON b.project_id = p.id AND b.build_phase_id = bp.id
LEFT JOIN estimate_summary e ON e.project_id = p.id AND e.build_phase_id = bp.id
WHERE p.is_active = true AND bp.is_active = true;

-- Create unique index for CONCURRENTLY refresh capability
CREATE UNIQUE INDEX ux_project_phase_summary
ON milestone.project_phase_summary(project_id, phase_id);

-- 3. Create update trigger function
CREATE OR REPLACE FUNCTION milestone.touch_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create triggers for auto-updating updated_at
CREATE TRIGGER trg_touch_projects
    BEFORE UPDATE ON milestone.projects
    FOR EACH ROW
    EXECUTE FUNCTION milestone.touch_updated_at();

CREATE TRIGGER trg_touch_build_phases
    BEFORE UPDATE ON milestone.build_phases
    FOR EACH ROW
    EXECUTE FUNCTION milestone.touch_updated_at();

CREATE TRIGGER trg_touch_invoices
    BEFORE UPDATE ON milestone.invoices
    FOR EACH ROW
    EXECUTE FUNCTION milestone.touch_updated_at();

CREATE TRIGGER trg_touch_bills
    BEFORE UPDATE ON milestone.bills
    FOR EACH ROW
    EXECUTE FUNCTION milestone.touch_updated_at();

CREATE TRIGGER trg_touch_project_estimates
    BEFORE UPDATE ON milestone.project_estimates
    FOR EACH ROW
    EXECUTE FUNCTION milestone.touch_updated_at();

CREATE TRIGGER trg_touch_phase_progress
    BEFORE UPDATE ON milestone.phase_progress
    FOR EACH ROW
    EXECUTE FUNCTION milestone.touch_updated_at();

CREATE TRIGGER trg_touch_user_preferences
    BEFORE UPDATE ON milestone.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION milestone.touch_updated_at();

-- 5. Create refresh function
CREATE OR REPLACE FUNCTION milestone.refresh_summaries()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY milestone.project_financial_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY milestone.project_phase_summary;
END;
$$ LANGUAGE plpgsql;

-- 6. Grant permissions
GRANT SELECT ON milestone.project_financial_summary TO milestone_user;
GRANT SELECT ON milestone.project_phase_summary TO milestone_user;

-- 7. Initial refresh
REFRESH MATERIALIZED VIEW milestone.project_financial_summary;
REFRESH MATERIALIZED VIEW milestone.project_phase_summary;

-- 8. Add comments for documentation
COMMENT ON MATERIALIZED VIEW milestone.project_financial_summary IS
'Aggregated financial summary per project. Used for dashboard and export functionality.';

COMMENT ON MATERIALIZED VIEW milestone.project_phase_summary IS
'Financial summary per project per construction phase. Used for phase tracking and reporting.';