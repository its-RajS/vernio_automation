import { getAdminClient } from "@/lib/supabase/admin";
import type { CreativePrompt } from "@/types/database";
import type { TemplateConstraints } from "@/lib/constants";

// Step 8: app assembles the final prompt — AI never touches this.
// ORDER IS INTENTIONAL: template zone rules first so they take precedence over
// brand prompts that often say "center composition" (conflicts with split layouts).
export function assembleFinalPrompt(params: {
  brandPrompt: string | null;
  primaryColor: string;
  secondaryColor: string;
  templateName: string;
  templateConstraints: TemplateConstraints;
  width: number;
  height: number;
  orientation: string;
  slideContext: string;
}): string {
  const lines: string[] = [];

  // 1. Template layout rule — FIRST. Prevents brand prompt from overriding zone constraints.
  lines.push(
    `Template: ${params.templateName}`,
    params.templateConstraints.imageInstruction,
    ""
  );

  // 2. Canvas — spatial context for the percentages above
  lines.push(
    `Canvas: ${params.width}x${params.height}`,
    `Orientation: ${params.orientation}`,
    "Do not crop. Fill the full canvas. All layout rules above are non-negotiable.",
    ""
  );

  // 3. Visual Scene — what gets drawn (within the visual zone only)
  lines.push("Visual Scene:", params.slideContext, "");

  // 4. Brand style — aesthetic guidance only; composition rules above take precedence
  if (params.brandPrompt) {
    lines.push("Brand Style (aesthetic only — composition rules above override any positioning in this section):", params.brandPrompt, "");
  }

  lines.push(
    `Primary Color: ${params.primaryColor}`,
    `Secondary Color: ${params.secondaryColor}`,
    ""
  );

  // 5. Negative prompt — always enforced regardless of brand prompt
  lines.push(
    "Negative Prompt:",
    `No humans.
No people.
No faces.
No bodies.
No hands.
No silhouettes.
No avatars.
No characters.
No mascots.
No portraits.
No figurative elements.
No readable text.
No typography.
No logos.
No company names.
No watermarks.
No borders.
No frames.
No screenshots.
No stock photo appearance.
No low resolution.
No pixelation.
No noise.
No cluttered composition.
No duplicated objects. No cropped objects. No exaggerated perspective. No unrealistic proportions. No cartoon style. No illustration sketch style. No flat design. No 2D infographic. No clipart. No UI mockup. No wireframe.
${params.templateConstraints.negativeAddendum}`
  );

  return lines.join("\n");
}

export function parseDimension(dimension: string): { width: number; height: number; orientation: string } {
  if (dimension === "1080x1920") return { width: 1080, height: 1920, orientation: "Portrait (9:16)" };
  if (dimension === "1920x1080") return { width: 1920, height: 1080, orientation: "Landscape (16:9)" };
  if (dimension === "1080x1350") return { width: 1080, height: 1350, orientation: "Portrait (4:5)" };
  if (dimension === "1080x1080") return { width: 1080, height: 1080, orientation: "Square (1:1)" };
  const [w, h] = dimension.split("x").map(Number);
  const orientation = w === h ? "Square (1:1)" : w > h ? "Landscape" : "Portrait";
  return { width: w || 1080, height: h || 1080, orientation };
}

export async function saveCreativePrompt(
  creativeId: string,
  slideContext: string,
  finalPrompt: string
): Promise<CreativePrompt> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("creative_prompts")
    .upsert(
      { creative_id: creativeId, slide_context: slideContext, final_prompt: finalPrompt, visual_prompt: slideContext } as any,
      { onConflict: "creative_id" }
    )
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to save prompt: ${error?.message}`);
  return data as CreativePrompt;
}
