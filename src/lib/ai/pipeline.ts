import { createClient } from "@/lib/supabase/server";
import { generateCreativeStructure } from "./openai";
import { extractTextFromAsset } from "./file-parser";
import type {
  CreativeSetInsert,
  SlideInsert,
  Project,
  Asset,
} from "@/types/database";

export async function runGenerationPipeline(projectId: string) {
  const supabase = await createClient();

  // 1. Fetch project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error(`Project not found: ${projectError?.message}`);
  }

  const p = project as Project;

  // 2. Update status to processing
  await supabase
    .from("projects")
    .update({ status: "processing" })
    .eq("id", projectId);

  try {
    // 3. Gather content — combine content_text + extracted file text
    const textParts: string[] = [];

    if (p.content_text?.trim()) {
      textParts.push(p.content_text.trim());
    }

    // 4. Extract text from uploaded files
    const { data: assets } = await supabase
      .from("assets")
      .select("*")
      .eq("project_id", projectId);

    if (assets) {
      for (const asset of assets as Asset[]) {
        try {
          const text = await extractTextFromAsset(asset.storage_path);
          if (text.trim()) {
            textParts.push(`--- From file: ${asset.file_name} ---\n${text.trim()}`);
          }
        } catch {
          // Skip files that can't be parsed
        }
      }
    }

    const combinedContent = textParts.join("\n\n");

    if (!combinedContent.trim()) {
      throw new Error("No content available to generate from");
    }

    // 5. Generate structure via AI
    const output = await generateCreativeStructure({
      content: combinedContent,
      platform: p.platform,
      dimension: p.dimension,
      template: p.template_id,
    });

    // 6. Save creative set
    const creativeSetInsert: CreativeSetInsert = {
      project_id: projectId,
      creative_count: output.creative_set.creative_count,
      creative_type: output.creative_set.creative_type,
      title: output.document.title,
      subtitle: output.document.subtitle,
      summary: output.document.summary,
    };

    const { data: creativeSet, error: csError } = await supabase
      .from("creative_sets")
      .insert(creativeSetInsert)
      .select()
      .single();

    if (csError || !creativeSet) {
      throw new Error(`Failed to save creative set: ${csError?.message}`);
    }

    // 7. Save slides
    const slideInserts: SlideInsert[] = output.slides.map((slide) => ({
      creative_set_id: creativeSet.id,
      slide_number: slide.slide_number,
      title: slide.title,
      subtitle: slide.subtitle,
      body: slide.body,
      key_takeaway: slide.key_takeaway,
    }));

    const { error: slidesError } = await supabase
      .from("slides")
      .insert(slideInserts);

    if (slidesError) {
      throw new Error(`Failed to save slides: ${slidesError?.message}`);
    }

    // 8. Update project status to completed
    await supabase
      .from("projects")
      .update({ status: "completed" })
      .eq("id", projectId);

    return { success: true };
  } catch (error) {
    // Mark as failed
    await supabase
      .from("projects")
      .update({ status: "failed" })
      .eq("id", projectId);

    throw error;
  }
}
