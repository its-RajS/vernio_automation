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
