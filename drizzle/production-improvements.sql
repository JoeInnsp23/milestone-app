-- Using default public schema in dedicated database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Auto-update trigger for updated_at columns
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'updated_at'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_touch_%I ON %I;
      CREATE TRIGGER trg_touch_%I
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION touch_updated_at();
    ', r.table_name, r.table_name, r.table_name, r.table_name);
  END LOOP;
END $$;

-- Create materialized view for dashboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS project_phase_summary AS
WITH invoice_summary AS (
    SELECT
        project_id,
        build_phase_id,
        SUM(CASE WHEN type = 'ACCREC' THEN total ELSE 0 END) as revenue,
        SUM(CASE WHEN type = 'ACCREC' THEN amount_paid ELSE 0 END) as revenue_paid,
        COUNT(CASE WHEN type = 'ACCREC' THEN 1 END) as invoice_count
    FROM invoices
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
    FROM bills
    WHERE status IN ('AUTHORISED', 'PAID')
    GROUP BY project_id, build_phase_id
),
estimate_summary AS (
    SELECT
        project_id,
        build_phase_id,
        SUM(CASE WHEN estimate_type = 'revenue' THEN amount ELSE 0 END) as estimated_revenue,
        SUM(CASE WHEN estimate_type = 'cost' THEN amount ELSE 0 END) as estimated_cost
    FROM project_estimates
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
FROM projects p
CROSS JOIN build_phases bp
LEFT JOIN invoice_summary i ON i.project_id = p.id AND i.build_phase_id = bp.id
LEFT JOIN bill_summary b ON b.project_id = p.id AND b.build_phase_id = bp.id
LEFT JOIN estimate_summary e ON e.project_id = p.id AND e.build_phase_id = bp.id
WHERE p.is_active = true AND bp.is_active = true;

-- REQUIRED: Unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS ux_project_phase_summary
ON project_phase_summary(project_id, phase_id);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY project_phase_summary;
END;
$$ LANGUAGE plpgsql;

-- Create database roles for security
DO $$
BEGIN
    -- Create read-only role for Xero-sourced tables
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_ro') THEN
        CREATE ROLE app_ro NOINHERIT;
    END IF;

    -- Create read/write role for user-managed tables
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_rw') THEN
        CREATE ROLE app_rw NOINHERIT;
    END IF;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA milestone TO app_ro, app_rw;

-- Read-only permissions for Xero-sourced tables
GRANT SELECT ON projects,
                build_phases,
                invoices,
                bills,
                sync_status,
                project_phase_summary
TO app_ro;

-- Read/write permissions for user-managed tables (app needs full CRUD for estimates)
GRANT SELECT, INSERT, UPDATE, DELETE ON
    project_estimates,
    export_history,
    user_preferences,
    audit_logs
TO app_rw;

-- Grant sequence usage for serial columns
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA milestone TO app_rw;

-- Create tracking category configuration table for n8n
CREATE TABLE IF NOT EXISTS tracking_config (
    id SERIAL PRIMARY KEY,
    tracking_type VARCHAR(50) NOT NULL CHECK (tracking_type IN ('PROJECT', 'PHASE')),
    tracking_category_id VARCHAR(50) NOT NULL,
    tracking_category_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tracking_type)
);