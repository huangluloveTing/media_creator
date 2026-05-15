ALTER TABLE projects
ADD COLUMN IF NOT EXISTS character_profile_json jsonb NULL;
