-- Phase 2.3-2.5: Creative Structuring, Prompt Generation, Image Generation
-- Run after phase2b-schema.sql

-- Structured creatives per campaign (one row per creative/slide)
CREATE TABLE IF NOT EXISTS campaign_creatives (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  campaign_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  creative_number INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  key_takeaway TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_creatives_campaign_id ON campaign_creatives(campaign_id);

ALTER TABLE campaign_creatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign creatives" ON campaign_creatives
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = campaign_creatives.campaign_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own campaign creatives" ON campaign_creatives
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = campaign_creatives.campaign_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own campaign creatives" ON campaign_creatives
  FOR UPDATE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = campaign_creatives.campaign_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own campaign creatives" ON campaign_creatives
  FOR DELETE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = campaign_creatives.campaign_id AND projects.user_id = auth.uid()));

-- AI-generated visual prompts (one per creative)
CREATE TABLE IF NOT EXISTS creative_prompts (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  creative_id TEXT NOT NULL REFERENCES campaign_creatives(id) ON DELETE CASCADE,
  visual_prompt TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_creative_prompts_creative_id ON creative_prompts(creative_id);

ALTER TABLE creative_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own creative prompts" ON creative_prompts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM campaign_creatives
    JOIN projects ON projects.id = campaign_creatives.campaign_id
    WHERE campaign_creatives.id = creative_prompts.creative_id AND projects.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own creative prompts" ON creative_prompts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM campaign_creatives
    JOIN projects ON projects.id = campaign_creatives.campaign_id
    WHERE campaign_creatives.id = creative_prompts.creative_id AND projects.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own creative prompts" ON creative_prompts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM campaign_creatives
    JOIN projects ON projects.id = campaign_creatives.campaign_id
    WHERE campaign_creatives.id = creative_prompts.creative_id AND projects.user_id = auth.uid()
  ));

-- Generated images (one per creative)
CREATE TABLE IF NOT EXISTS creative_assets (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  creative_id TEXT NOT NULL REFERENCES campaign_creatives(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  provider TEXT NOT NULL DEFAULT 'openai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_creative_assets_creative_id ON creative_assets(creative_id);

ALTER TABLE creative_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own creative assets" ON creative_assets
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM campaign_creatives
    JOIN projects ON projects.id = campaign_creatives.campaign_id
    WHERE campaign_creatives.id = creative_assets.creative_id AND projects.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own creative assets" ON creative_assets
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM campaign_creatives
    JOIN projects ON projects.id = campaign_creatives.campaign_id
    WHERE campaign_creatives.id = creative_assets.creative_id AND projects.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own creative assets" ON creative_assets
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM campaign_creatives
    JOIN projects ON projects.id = campaign_creatives.campaign_id
    WHERE campaign_creatives.id = creative_assets.creative_id AND projects.user_id = auth.uid()
  ));
