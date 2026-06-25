import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractAndStoreContent } from "@/modules/content-processing/content-processing.service";
import { detectStructure } from "@/modules/content-processing/content-structure-detector.service";
import { analyzeContent, analyzeDocumentMeta } from "@/modules/ai/ai.service";
import type { CampaignAnalysisInsert, CreativeType } from "@/types/database";

function inferCreativeType(count: number): CreativeType {
  if (count === 1) return "single_post";
  if (count <= 4) return "multi_post";
  return "carousel";
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  try {
    // Step 1: extract content
    const { rawText } = await extractAndStoreContent(id);

    // Structure detection — user-defined structure always wins
    const detected = detectStructure(rawText);

    let insert: CampaignAnalysisInsert;

    if (detected.hasStructure) {
      // AI only analyses document metadata — creative count comes from the doc
      const meta = await analyzeDocumentMeta(rawText);

      insert = {
        campaign_id: id,
        title: meta.title,
        summary: meta.summary,
        content_type: meta.content_type,
        creative_type: inferCreativeType(detected.count),
        recommended_creative_count: detected.count,
        tone: meta.tone,
        key_topics: meta.key_topics,
        target_audience: meta.target_audience,
        count_source: "user_defined",
        slides_json: detected.slides,
      };
    } else {
      // AI decides creative count and type
      const analysis = await analyzeContent(rawText);

      insert = {
        campaign_id: id,
        title: analysis.title,
        summary: analysis.summary,
        content_type: analysis.content_type,
        creative_type: analysis.creative_type,
        recommended_creative_count: analysis.recommended_creative_count,
        tone: analysis.tone,
        key_topics: analysis.key_topics,
        target_audience: analysis.target_audience,
        count_source: "ai_generated",
        slides_json: [],
      };
    }

    const { data: saved, error: saveError } = await supabase
      .from("campaign_analysis")
      .upsert(insert, { onConflict: "campaign_id" })
      .select()
      .single();

    if (saveError || !saved) {
      throw new Error(`Failed to save analysis: ${saveError?.message}`);
    }

    return NextResponse.json({ analysis: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
