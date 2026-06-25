-- Phase 2 refactor: deterministic prompt pipeline
-- Run after phase23-schema.sql

-- Step 2: add tone to content analysis
ALTER TABLE campaign_analysis ADD COLUMN IF NOT EXISTS tone TEXT;

-- Step 4: store slide_context (AI output) and final_prompt (app-assembled) on creative_prompts
ALTER TABLE creative_prompts ADD COLUMN IF NOT EXISTS slide_context TEXT NOT NULL DEFAULT '';
ALTER TABLE creative_prompts ADD COLUMN IF NOT EXISTS final_prompt TEXT NOT NULL DEFAULT '';

-- Step 9: store generation_time (ms) and final_prompt sent to image API
ALTER TABLE creative_assets ADD COLUMN IF NOT EXISTS generation_time INTEGER;
ALTER TABLE creative_assets ADD COLUMN IF NOT EXISTS final_prompt TEXT;
