export type ProjectStatus = "draft" | "processing" | "completed" | "failed";

export type Platform = "linkedin" | "instagram" | "facebook" | "x";

export type Dimension =
  | "1080x1080"
  | "1080x1350"
  | "1080x1920"
  | "custom";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  platform: Platform;
  dimension: Dimension;
  template_id: string;
  content_text: string | null;
  brand_name: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  brand_prompt: string | null;
  resolution: string | null;
  creative_count: number | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  config_json: Record<string, unknown>;
  created_at: string;
}

export interface Asset {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  created_at: string;
}

export type ProjectInsert = Omit<Project, "id" | "created_at" | "updated_at">;
export type ProjectUpdate = Partial<Omit<Project, "id" | "user_id" | "created_at">>;

export type AssetInsert = Omit<Asset, "id" | "created_at">;

export type CreativeType = "single_post" | "multi_post" | "carousel";

export interface CreativeSet {
  id: string;
  project_id: string;
  creative_count: number;
  creative_type: CreativeType;
  title: string | null;
  subtitle: string | null;
  summary: string | null;
  created_at: string;
}

export interface Slide {
  id: string;
  creative_set_id: string;
  slide_number: number;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  key_takeaway: string | null;
  created_at: string;
}

export type CreativeSetInsert = Omit<CreativeSet, "id" | "created_at">;
export type SlideInsert = Omit<Slide, "id" | "created_at">;

export type ContentSourceType = "manual" | "file" | "mixed";

export type CountSource = "user_defined" | "ai_generated";

export interface DetectedSlide {
  slide_number: number;
  title: string;
  subtitle: string;
  body: string;
  key_takeaway: string;
}

export interface CampaignContent {
  id: string;
  campaign_id: string;
  raw_text: string;
  source_type: ContentSourceType;
  created_at: string;
  updated_at: string;
}

export interface CampaignAnalysis {
  id: string;
  campaign_id: string;
  title: string;
  summary: string;
  content_type: string;
  creative_type: CreativeType;
  recommended_creative_count: number;
  tone: string | null;
  key_topics: string[];
  target_audience: string;
  visual_direction: string | null;
  count_source: CountSource;
  slides_json: DetectedSlide[];
  created_at: string;
  updated_at: string;
}

export type CampaignContentInsert = Omit<CampaignContent, "id" | "created_at" | "updated_at">;
export type CampaignAnalysisInsert = Omit<CampaignAnalysis, "id" | "created_at" | "updated_at" | "visual_direction"> & {
  tone?: string | null;
  visual_direction?: string | null;
};

export interface CampaignCreative {
  id: string;
  campaign_id: string;
  creative_number: number;
  title: string;
  subtitle: string;
  body: string;
  key_takeaway: string;
  created_at: string;
  updated_at: string;
}

export interface CreativePrompt {
  id: string;
  creative_id: string;
  visual_prompt: string;
  slide_context: string;
  final_prompt: string;
  created_at: string;
}

export type AssetStatus = "pending" | "processing" | "completed" | "failed";

export interface CreativeAsset {
  id: string;
  creative_id: string;
  image_url: string;
  status: AssetStatus;
  provider: string;
  generation_time: number | null;
  final_prompt: string | null;
  created_at: string;
}

export interface CreativeWithAssets extends CampaignCreative {
  creative_prompts: CreativePrompt[];
  creative_assets: CreativeAsset[];
  signedImageUrl?: string | null;
}

export type CampaignCreativeInsert = Omit<CampaignCreative, "id" | "created_at" | "updated_at">;
export type CreativePromptInsert = Omit<CreativePrompt, "id" | "created_at">;
export type CreativeAssetInsert = Omit<CreativeAsset, "id" | "created_at">;

export interface AIOutput {
  document: {
    title: string;
    subtitle: string;
    summary: string;
  };
  creative_set: {
    creative_count: number;
    creative_type: CreativeType;
  };
  slides: Array<{
    slide_number: number;
    title: string;
    subtitle: string;
    body: string;
    key_takeaway: string;
  }>;
}
