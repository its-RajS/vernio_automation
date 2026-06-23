"use server";

import { createClient } from "@/lib/supabase/server";
import type { ProjectInsert, AssetInsert } from "@/types/database";
import { redirect } from "next/navigation";
import { runGenerationPipeline } from "@/lib/ai/pipeline";

export async function createProject(data: {
  name: string;
  platform: string;
  dimension: string;
  template_id: string;
  content_text: string | null;
  resolution?: string;
  creative_count?: number;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const insert: ProjectInsert = {
    user_id: user.id,
    name: data.name,
    platform: data.platform as ProjectInsert["platform"],
    dimension: data.dimension as ProjectInsert["dimension"],
    template_id: data.template_id,
    content_text: data.content_text,
    resolution: data.resolution || "1080p",
    creative_count: data.creative_count || 1,
    status: "draft",
  };

  const { data: project, error } = await supabase
    .from("projects")
    .insert(insert)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: project };
}

export async function getProjects() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

export async function getProject(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

export async function getProjectAssets(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

export async function uploadProjectAsset(
  projectId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file provided" };
  }

  // Validate file type
  const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Invalid file type. Only PDF and DOCX files are allowed." };
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "File too large. Maximum size is 10MB." };
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase();
  if (!fileExt || !["pdf", "docx"].includes(fileExt)) {
    return { error: "Invalid file extension. Only .pdf and .docx are allowed." };
  }

  const fileName = `${Date.now()}.${fileExt}`;
  const storagePath = `${user.id}/${projectId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("project-assets")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const assetInsert: AssetInsert = {
    project_id: projectId,
    file_name: file.name,
    file_type: file.type,
    storage_path: storagePath,
  };

  const { data: asset, error: insertError } = await supabase
    .from("assets")
    .insert(assetInsert)
    .select()
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  return { data: asset };
}

export async function getAllAssets() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .select("*, projects(name, platform)")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

export async function getCreativeSets(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("creative_sets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

export async function getSlides(creativeSetId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("slides")
    .select("*")
    .eq("creative_set_id", creativeSetId)
    .order("slide_number", { ascending: true });

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

export async function getTotalSlideCount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  // Get all projects for the user
  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", user.id);

  if (!projects || projects.length === 0) {
    return { data: 0, error: null };
  }

  const projectIds = projects.map((p) => p.id);

  // Get all creative sets for these projects
  const { data: creativeSets } = await supabase
    .from("creative_sets")
    .select("id, creative_count")
    .in("project_id", projectIds);

  if (!creativeSets || creativeSets.length === 0) {
    return { data: 0, error: null };
  }

  // Sum up all creative_count values
  const totalSlides = creativeSets.reduce(
    (sum, cs) => sum + cs.creative_count,
    0
  );

  return { data: totalSlides, error: null };
}

export async function generateCreatives(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify project belongs to user
  const { data: project } = await supabase
    .from("projects")
    .select("id, status")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return { error: "Project not found" };
  }

  // Defer to pipeline — fire without awaiting so the client gets
  // an immediate response while generation runs in the background.
  // For production, this should use a queue (e.g. pgmq or Inngest).
  runGenerationPipeline(projectId).catch(() => {});

  return { success: true };
}

export async function updateProject(id: string, data: {
  name?: string;
  platform?: string;
  dimension?: string;
  template_id?: string;
  content_text?: string | null;
  status?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify project belongs to user
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return { error: "Project not found" };
  }

  const updateData: any = { updated_at: new Date().toISOString() };
  
  // Sanitize inputs
  if (data.name !== undefined) {
    const sanitizedName = sanitizeString(data.name);
    if (!sanitizedName) {
      return { error: "Project name cannot be empty" };
    }
    updateData.name = sanitizedName;
  }
  if (data.platform !== undefined) updateData.platform = data.platform;
  if (data.dimension !== undefined) updateData.dimension = data.dimension;
  if (data.template_id !== undefined) updateData.template_id = data.template_id;
  if (data.content_text !== undefined) {
    updateData.content_text = data.content_text ? sanitizeString(data.content_text) : null;
  }
  if (data.status !== undefined) updateData.status = data.status;

  const { data: project, error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: project };
}

export async function getBrandProfiles() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  const { data, error } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

export async function createBrandProfile(data: {
  name: string;
  primary_color: string;
  secondary_color: string;
  logo_url?: string | null;
  brand_prompt?: string | null;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile, error } = await supabase
    .from("brand_profiles")
    .insert({
      user_id: user.id,
      name: data.name,
      primary_color: data.primary_color,
      secondary_color: data.secondary_color,
      logo_url: data.logo_url || null,
      brand_prompt: data.brand_prompt || null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: profile };
}

export async function updateBrandProfile(id: string, data: {
  name?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string | null;
  brand_prompt?: string | null;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const updateData: any = { updated_at: new Date().toISOString() };
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.primary_color !== undefined) updateData.primary_color = data.primary_color;
  if (data.secondary_color !== undefined) updateData.secondary_color = data.secondary_color;
  if (data.logo_url !== undefined) updateData.logo_url = data.logo_url;
  if (data.brand_prompt !== undefined) updateData.brand_prompt = data.brand_prompt;

  const { data: profile, error } = await supabase
    .from("brand_profiles")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: profile };
}

export async function deleteProject(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get assets to clean up storage
  const { data: assets } = await supabase
    .from("assets")
    .select("storage_path")
    .eq("project_id", id);

  // Delete files from storage
  if (assets && assets.length > 0) {
    const paths = assets.map(a => a.storage_path);
    await supabase.storage.from("project-assets").remove(paths);
  }

  // Delete project (cascades to assets, creative_sets, slides)
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
function sanitizeString(content_text: string | null): any {
  if (!content_text) {
    return "";
  }
  const regex = /^[\x00-\x1F\x7F-\x9F\uFFFE\uFFFF]/;
  return content_text.replace(regex, "");
}

