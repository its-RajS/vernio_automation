import { getAdminClient } from "@/lib/supabase/admin";
import { generateCreativeList } from "@/modules/ai/ai.service";
import type { CampaignCreative, CampaignCreativeInsert, DetectedSlide } from "@/types/database";

export async function structureCreatives(campaignId: string): Promise<CampaignCreative[]> {
  const supabase = getAdminClient();

  const { data: analysisData } = await supabase
    .from("campaign_analysis")
    .select("count_source, slides_json, recommended_creative_count")
    .eq("campaign_id", campaignId)
    .single();

  if (!analysisData) {
    throw new Error("Content analysis not found. Analyze content before generating assets.");
  }

  const analysis = analysisData as any;
  let toInsert: CampaignCreativeInsert[];

  if (analysis.count_source === "user_defined") {
    // Preserve creator-defined structure — no AI
    const slides = (analysis.slides_json ?? []) as DetectedSlide[];
    if (slides.length === 0) {
      throw new Error("No slides found in user-defined structure.");
    }
    toInsert = slides.map((slide) => ({
      campaign_id: campaignId,
      creative_number: slide.slide_number,
      title: slide.title,
      subtitle: slide.subtitle,
      body: slide.body,
      key_takeaway: slide.key_takeaway,
    }));
  } else {
    // AI generates structured creatives from content (count already decided by Step 2)
    const { data: contentData } = await supabase
      .from("campaign_content")
      .select("raw_text")
      .eq("campaign_id", campaignId)
      .single();

    if (!(contentData as any)?.raw_text) {
      throw new Error("No extracted content found. Analyze content before generating assets.");
    }

    const count = analysis.recommended_creative_count ?? 1;
    const output = await generateCreativeList((contentData as any).raw_text, count);

    toInsert = output.creatives.map((c) => ({
      campaign_id: campaignId,
      creative_number: c.creative_number,
      title: c.title,
      subtitle: c.subtitle,
      body: c.body,
      key_takeaway: c.key_takeaway,
    }));
  }

  // Idempotent: delete existing (cascades to prompts + assets), insert fresh
  await supabase.from("campaign_creatives").delete().eq("campaign_id", campaignId);

  const { data: saved, error } = await supabase
    .from("campaign_creatives")
    .insert(toInsert as any)
    .select();

  if (error || !saved) {
    throw new Error(`Failed to save creatives: ${error?.message}`);
  }

  return saved as CampaignCreative[];
}
