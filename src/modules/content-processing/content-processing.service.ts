import { createClient } from "@/lib/supabase/server";
import { extractTextFromAsset } from "@/lib/ai/file-parser";
import type { Asset, ContentSourceType, CampaignContentInsert } from "@/types/database";

export interface ExtractionResult {
  rawText: string;
  sourceType: ContentSourceType;
}

export async function extractAndStoreContent(
  campaignId: string
): Promise<ExtractionResult> {
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("content_text")
    .eq("id", campaignId)
    .single();

  if (projectError || !project) {
    throw new Error("Campaign not found");
  }

  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("project_id", campaignId);

  const textParts: string[] = [];
  const assetErrors: string[] = [];

  if (project.content_text?.trim()) {
    textParts.push(project.content_text.trim());
  }

  if (assets && assets.length > 0) {
    for (const asset of assets as Asset[]) {
      try {
        const text = await extractTextFromAsset(asset.storage_path);
        if (text.trim()) {
          textParts.push(text.trim());
        } else {
          assetErrors.push(`${asset.file_name}: no readable text found`);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown extraction error";
        assetErrors.push(`${asset.file_name}: ${message}`);
      }
    }
  }

  if (textParts.length === 0) {
    if (assetErrors.length > 0) {
      throw new Error(
        `No extractable content found in this campaign. ${assetErrors.join("; ")}`
      );
    }
    throw new Error("No extractable content found in this campaign");
  }

  const hasManual = !!project.content_text?.trim();
  const hasFiles = !!(assets && assets.length > 0);
  const sourceType: ContentSourceType =
    hasManual && hasFiles ? "mixed" : hasFiles ? "file" : "manual";

  const rawText = textParts.join("\n\n");

  // Upsert — one row per campaign
  const insert: CampaignContentInsert = {
    campaign_id: campaignId,
    raw_text: rawText,
    source_type: sourceType,
  };

  const { error: upsertError } = await supabase
    .from("campaign_content")
    .upsert(insert, { onConflict: "campaign_id" });

  if (upsertError) {
    throw new Error(`Failed to store extracted content: ${upsertError.message}`);
  }

  return { rawText, sourceType };
}
