ALTER TABLE projects
ADD COLUMN IF NOT EXISTS prep_nodes jsonb NULL DEFAULT '[]'::jsonb;
