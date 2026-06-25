-- Phase 2b: Add count_source and slides_json to campaign_analysis
-- Run after phase2-schema.sql

ALTER TABLE campaign_analysis
  ADD COLUMN IF NOT EXISTS count_source TEXT NOT NULL DEFAULT 'ai_generated'
    CHECK (count_source IN ('user_defined', 'ai_generated'));

ALTER TABLE campaign_analysis
  ADD COLUMN IF NOT EXISTS slides_json JSONB NOT NULL DEFAULT '[]';
