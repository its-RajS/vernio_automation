import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { structureCreatives } from "@/modules/creative-structuring/creative-structuring.service";
import { generateSlideContext } from "@/modules/ai/ai.service";
import { assembleFinalPrompt, parseDimension, saveCreativePrompt } from "@/modules/prompt-generation/prompt-generation.service";
import { generateAndStoreImage, saveCreativeAsset } from "@/modules/image-generation/image-generation.service";
import { TEMPLATES } from "@/lib/constants";
import type { CampaignCreative } from "@/types/database";

async function runAssetPipeline(
  campaignId: string,
  userId: string,
  project: {
    platform: string;
    dimension: string;
    template_id: string;
    brand_name?: string | null;
    brand_prompt?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
  }
) {
  // Step 5: read brand configuration
  const brand = {
    brandPrompt: project.brand_prompt ?? null,
    primaryColor: project.primary_color ?? "#8B5CF6",
    secondaryColor: project.secondary_color ?? "#2563EB",
  };

  // Step 6: read template constraints
  const templateConfig = TEMPLATES.find((t) => t.id === project.template_id) ?? TEMPLATES[0];
  const templateConstraints = templateConfig.constraints;
  const templateName = templateConfig.name;

  // Step 7: read dimensions
  const { width, height, orientation } = parseDimension(project.dimension);

  // Step 3: structure creatives
  const creatives = await structureCreatives(campaignId);

  let successCount = 0;
  let failedCount = 0;

  for (const creative of creatives as CampaignCreative[]) {
    try {
      // Step 4: AI generates slide context (visual scene only, no colors/layout/branding)
      const slideContext = await generateSlideContext(creative);

      // Step 8: app assembles final prompt (deterministic — no AI)
      const finalPrompt = assembleFinalPrompt({
        brandPrompt: brand.brandPrompt,
        primaryColor: brand.primaryColor,
        secondaryColor: brand.secondaryColor,
        templateName,
        templateConstraints,
        width,
        height,
        orientation,
        slideContext,
      });

      await saveCreativePrompt(creative.id, slideContext, finalPrompt);

      // Step 9: generate image with assembled prompt
      const { storagePath, generationTime } = await generateAndStoreImage({
        prompt: finalPrompt,
        dimension: project.dimension,
        userId,
        campaignId,
        creativeId: creative.id,
      });

      await saveCreativeAsset({
        creativeId: creative.id,
        storagePath,
        provider: "openai",
        status: "completed",
        generationTime,
        finalPrompt,
      });

      successCount++;
    } catch (err) {
      console.error(`[PIPELINE] Error on creative ${creative.creative_number}:`, err);
      failedCount++;

      await saveCreativeAsset({
        creativeId: creative.id,
        storagePath: "",
        provider: "openai",
        status: "failed",
      }).catch(() => {});
    }
  }

  console.log(`[PIPELINE] Done: ${successCount} ok, ${failedCount} failed`);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getAdminClient();

  const { data: projectData } = await supabase
    .from("projects")
    .select("id, user_id, platform, dimension, template_id, brand_name, brand_prompt, primary_color, secondary_color")
    .eq("id", id)
    .single();

  if (!projectData)
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const project = projectData as any;

  const { data: analysisData } = await supabase
    .from("campaign_analysis")
    .select("id")
    .eq("campaign_id", id)
    .single();

  if (!analysisData) {
    return NextResponse.json({ error: "Run content analysis first." }, { status: 400 });
  }

  // ponytail: fire and forget; use Inngest/pgmq queue in production
  runAssetPipeline(id, project.user_id, project).catch((err) => {
    console.error("Asset pipeline error:", err);
  });

  return NextResponse.json({ status: "processing" });
}
