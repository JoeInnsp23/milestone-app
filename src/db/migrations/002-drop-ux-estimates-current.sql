ALTER TABLE milestone.project_estimates DROP CONSTRAINT IF EXISTS ux_estimates_current;

DROP INDEX IF EXISTS milestone."ux_estimates_current";
