ALTER TABLE storyboard_drafts
ADD COLUMN IF NOT EXISTS character_profile_json jsonb NULL;
