-- Phase 2: Content Extraction + AI Analysis tables
-- Run in Supabase SQL Editor after schema.sql

-- Stores combined raw text extracted from a campaign's content sources
CREATE TABLE IF NOT EXISTS campaign_content (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  campaign_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_campaign_content_campaign_id ON campaign_content(campaign_id);

ALTER TABLE campaign_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign content" ON campaign_content
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = campaign_content.campaign_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own campaign content" ON campaign_content
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = campaign_content.campaign_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can update own campaign content" ON campaign_content
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = campaign_content.campaign_id AND projects.user_id = auth.uid())
  );

-- Stores AI content analysis result per campaign (one per campaign, upserted)
CREATE TABLE IF NOT EXISTS campaign_analysis (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  campaign_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  creative_type TEXT NOT NULL CHECK (creative_type IN ('single_post', 'multi_post', 'carousel')),
  recommended_creative_count INTEGER NOT NULL DEFAULT 1,
  key_topics JSONB NOT NULL DEFAULT '[]',
  target_audience TEXT NOT NULL DEFAULT '',
  visual_direction TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_campaign_analysis_campaign_id ON campaign_analysis(campaign_id);

ALTER TABLE campaign_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign analysis" ON campaign_analysis
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = campaign_analysis.campaign_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own campaign analysis" ON campaign_analysis
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = campaign_analysis.campaign_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can update own campaign analysis" ON campaign_analysis
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = campaign_analysis.campaign_id AND projects.user_id = auth.uid())
  );
