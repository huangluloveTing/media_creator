CREATE TABLE IF NOT EXISTS storyboard_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version integer NOT NULL,
  instruction text NOT NULL,
  storyboard_json jsonb NOT NULL,
  summary text NULL,
  diff_json jsonb NULL,
  is_applied boolean NOT NULL DEFAULT false,
  applied_at timestamptz NULL,
  created_by varchar(128) NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_storyboard_drafts_project_version UNIQUE (project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_storyboard_drafts_project_id
  ON storyboard_drafts(project_id);
