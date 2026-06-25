import OpenAI from "openai";
import { getAdminClient } from "@/lib/supabase/admin";
import type { CreativeAsset, AssetStatus } from "@/types/database";

export interface ImageGenerationProvider {
  name: string;
  generate(
    prompt: string,
    size: "1024x1024" | "1024x1536" | "1536x1024" | "1024x1792" | "1792x1024"
  ): Promise<Buffer>;
}

class OpenAIImageProvider implements ImageGenerationProvider {
  name = "openai";
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  }

  async generate(
    prompt: string,
    size: "1024x1024" | "1024x1536" | "1536x1024" | "1024x1792" | "1792x1024"
  ): Promise<Buffer> {
    const isGPTImageModel = this.model.startsWith("gpt-image");

    const response = await this.client.images.generate(
      isGPTImageModel
        ? {
            model: this.model,
            prompt,
            size: normalizeSizeForModel(size, this.model),
            quality: "high",
            output_format: "png",
            n: 1,
          }
        : {
            model: this.model,
            prompt,
            size: normalizeSizeForModel(size, this.model),
            quality: "hd",
            n: 1,
          }
    );

    const b64 = response.data?.[0]?.b64_json;
    if (b64) return Buffer.from(b64, "base64");

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) throw new Error("OpenAI returned no image data");

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`Failed to download generated image: ${imageResponse.status}`);
    return Buffer.from(await imageResponse.arrayBuffer());
  }
}

// ponytail: singleton — swap to SeedreamProvider or FluxProvider here when ready
const defaultProvider: ImageGenerationProvider = new OpenAIImageProvider();

function dimensionToSize(dimension: string): "1024x1024" | "1024x1536" | "1536x1024" | "1024x1792" | "1792x1024" {
  if (dimension === "1080x1920") return "1024x1536";
  if (dimension === "1080x1350") return "1024x1536";
  if (dimension === "1920x1080") return "1536x1024";
  return "1024x1024";
}

function normalizeSizeForModel(
  size: "1024x1024" | "1024x1536" | "1536x1024" | "1024x1792" | "1792x1024",
  model: string
): "1024x1024" | "1024x1536" | "1536x1024" | "1024x1792" | "1792x1024" {
  if (model.startsWith("gpt-image")) {
    if (size === "1024x1792") return "1024x1536";
    if (size === "1792x1024") return "1536x1024";
  }
  return size;
}

export async function generateAndStoreImage(params: {
  prompt: string;
  dimension: string;
  userId: string;
  campaignId: string;
  creativeId: string;
  provider?: ImageGenerationProvider;
}): Promise<{ storagePath: string; generationTime: number }> {
  const provider = params.provider ?? defaultProvider;
  const supabase = getAdminClient();
  const size = dimensionToSize(params.dimension);

  const start = Date.now();
  const buffer = await provider.generate(params.prompt, size);
  const generationTime = Date.now() - start;

  const storagePath = `${params.userId}/${params.campaignId}/creatives/${params.creativeId}.png`;

  const { error } = await supabase.storage
    .from("project-assets")
    .upload(storagePath, buffer, { contentType: "image/png", upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  return { storagePath, generationTime };
}

export async function saveCreativeAsset(params: {
  creativeId: string;
  storagePath: string;
  provider: string;
  status: AssetStatus;
  generationTime?: number;
  finalPrompt?: string;
}): Promise<CreativeAsset> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("creative_assets")
    .upsert(
      {
        creative_id: params.creativeId,
        image_url: params.storagePath,
        status: params.status,
        provider: params.provider,
        generation_time: params.generationTime ?? null,
        final_prompt: params.finalPrompt ?? null,
      } as any,
      { onConflict: "creative_id" }
    )
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to save asset: ${error?.message}`);
  return data as CreativeAsset;
}
