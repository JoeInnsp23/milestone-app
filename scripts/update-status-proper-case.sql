-- Update existing project statuses to use proper case
UPDATE milestone.projects
SET status =
  CASE
    WHEN status = 'active' THEN 'Active'
    WHEN status = 'completed' THEN 'Completed'
    WHEN status = 'on_hold' THEN 'On Hold'
    WHEN status = 'draft' THEN 'Draft'
    ELSE INITCAP(status)  -- Convert any other values to proper case
  END
WHERE status IS NOT NULL;

-- Verify the update
SELECT DISTINCT status, COUNT(*) as count
FROM milestone.projects
GROUP BY status
ORDER BY status;