-- Vernio Automation: Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  config_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'facebook', 'x')),
  dimension TEXT NOT NULL,
  template_id TEXT NOT NULL REFERENCES templates(id),
  content_text TEXT,
  brand_name TEXT,
  primary_color TEXT DEFAULT '#8B5CF6',
  secondary_color TEXT DEFAULT '#2563EB',
  brand_prompt TEXT,
  resolution TEXT DEFAULT '1080p',
  creative_count INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Assets (scoped to project ownership)
CREATE POLICY "Users can view own assets" ON assets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own assets" ON assets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own assets" ON assets
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = assets.project_id AND projects.user_id = auth.uid())
  );

-- RLS Policies: Templates (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view templates" ON templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Seed default templates
INSERT INTO templates (id, name, description, config_json) VALUES
  ('corporate-left-hero', 'Corporate Left Hero', 'Professional layout with left-aligned hero text and branding.', '{"layout": "left-hero", "style": "corporate"}'),
  ('centered-statement', 'Centered Statement', 'Bold centered text for impactful statements and quotes.', '{"layout": "centered", "style": "bold"}'),
  ('minimal-saas', 'Minimal SaaS', 'Clean and modern layout suited for technology brands.', '{"layout": "minimal", "style": "modern"}'),
  ('government', 'Government', 'Formal and structured layout for government communications.', '{"layout": "structured", "style": "formal"}')
ON CONFLICT (id) DO NOTHING;

-- Brand profiles table
CREATE TABLE IF NOT EXISTS brand_profiles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  primary_color TEXT NOT NULL DEFAULT '#8B5CF6',
  secondary_color TEXT NOT NULL DEFAULT '#2563EB',
  logo_url TEXT,
  brand_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id ON brand_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Brand profiles
CREATE POLICY "Users can view own brand profiles" ON brand_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand profiles" ON brand_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand profiles" ON brand_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand profiles" ON brand_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Creative sets table
CREATE TABLE IF NOT EXISTS creative_sets (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  creative_count INTEGER NOT NULL,
  creative_type TEXT NOT NULL CHECK (creative_type IN ('single_post', 'multi_post', 'carousel')),
  title TEXT,
  subtitle TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Slides table
CREATE TABLE IF NOT EXISTS slides (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  creative_set_id TEXT NOT NULL REFERENCES creative_sets(id) ON DELETE CASCADE,
  slide_number INTEGER NOT NULL,
  title TEXT,
  subtitle TEXT,
  body TEXT,
  key_takeaway TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creative_sets_project_id ON creative_sets(project_id);
CREATE INDEX IF NOT EXISTS idx_slides_creative_set_id ON slides(creative_set_id);

-- RLS Policies: Creative sets (scoped to project ownership)
CREATE POLICY "Users can view own creative sets" ON creative_sets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = creative_sets.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own creative sets" ON creative_sets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = creative_sets.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own creative sets" ON creative_sets
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = creative_sets.project_id AND projects.user_id = auth.uid())
  );

-- RLS Policies: Slides (scoped to project ownership via creative_sets)
CREATE POLICY "Users can view own slides" ON slides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM creative_sets
      JOIN projects ON projects.id = creative_sets.project_id
      WHERE creative_sets.id = slides.creative_set_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own slides" ON slides
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM creative_sets
      JOIN projects ON projects.id = creative_sets.project_id
      WHERE creative_sets.id = slides.creative_set_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own slides" ON slides
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM creative_sets
      JOIN projects ON projects.id = creative_sets.project_id
      WHERE creative_sets.id = slides.creative_set_id AND projects.user_id = auth.uid()
    )
  );

-- Storage bucket for project assets
-- Run this separately or via Supabase dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-assets', 'project-assets', false);

-- Storage RLS policies:
CREATE POLICY "Users can upload project assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own project assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own project assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
