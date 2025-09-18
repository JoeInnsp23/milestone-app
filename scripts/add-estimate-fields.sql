-- Add new columns to project_estimates table with defaults for existing data
ALTER TABLE milestone.project_estimates
ADD COLUMN IF NOT EXISTS description VARCHAR(500) DEFAULT 'Estimate';

ALTER TABLE milestone.project_estimates
ADD COLUMN IF NOT EXISTS estimate_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE milestone.project_estimates
ADD COLUMN IF NOT EXISTS confidence_level INTEGER DEFAULT 3;

-- Update existing rows to have proper values
UPDATE milestone.project_estimates
SET description = COALESCE(notes, 'Estimate ' || estimate_type)
WHERE description IS NULL OR description = 'Estimate';

UPDATE milestone.project_estimates
SET estimate_date = COALESCE(valid_from, created_at::date, CURRENT_DATE)
WHERE estimate_date IS NULL;

-- Now make description and estimate_date required
ALTER TABLE milestone.project_estimates
ALTER COLUMN description SET NOT NULL;

ALTER TABLE milestone.project_estimates
ALTER COLUMN estimate_date SET NOT NULL;