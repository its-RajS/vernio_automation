-- Phase 2c: Persist brand context on each project
-- Run after schema.sql / existing phase migrations

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS brand_name TEXT;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#8B5CF6';

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#2563EB';

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS brand_prompt TEXT;
