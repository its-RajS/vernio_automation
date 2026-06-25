-- Templates are managed in code (constants.ts), not the database.
-- The FK constraint requires DB rows for every template defined in code,
-- which breaks on every template change. Drop it.

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_template_id_fkey;

-- Upsert current template definitions for reference (no FK enforced)
INSERT INTO templates (id, name, description, config_json) VALUES
  ('editorial-left',       'Editorial Left',          'Text on left, visual subject on right.',                               '{"layout":"editorial-left"}'),
  ('editorial-right',      'Editorial Right',         'Text on right, visual subject on left.',                              '{"layout":"editorial-right"}'),
  ('top-title',            'Top Title',               'Headline at top, full visual below.',                                 '{"layout":"top-title"}'),
  ('bottom-caption',       'Bottom Caption',          'Visual fills top, caption area at bottom.',                           '{"layout":"bottom-caption"}'),
  ('center-statement',     'Center Statement',        'Bold text in center band, visual frames top and bottom.',             '{"layout":"center-statement"}'),
  ('story-top',            'Story — Top Text',        'Text at top, rich visual below. Optimized for 9:16.',                '{"layout":"story-top"}'),
  ('story-bottom',         'Story — Bottom Text',     'Rich visual at top, caption at bottom. Optimized for 9:16.',         '{"layout":"story-bottom"}'),
  ('full-bleed-gradient',  'Full Bleed — Gradient',   'Visual fills canvas, organic dark gradient at bottom for text.',     '{"layout":"full-bleed-gradient"}'),
  ('poster-classic',       'Poster Classic',          'Dark center band for title, visual subjects frame top and bottom.',  '{"layout":"poster-classic"}'),
  ('sidebar-bold',         'Sidebar Bold',            'Solid left sidebar for text, rich visual fills right side.',         '{"layout":"sidebar-bold"}')
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      config_json = EXCLUDED.config_json;
