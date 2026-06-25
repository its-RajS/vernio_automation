import OpenAI from "openai";
import {
  contentAnalysisSchema,
  contentAnalysisJsonSchema,
  documentAnalysisSchema,
  documentAnalysisJsonSchema,
  type ContentAnalysisOutput,
  type DocumentAnalysisOutput,
} from "./schemas/content-analysis.schema";
import {
  CONTENT_ANALYSIS_SYSTEM_PROMPT,
  DOCUMENT_ANALYSIS_SYSTEM_PROMPT,
  SLIDE_CONTEXT_SYSTEM_PROMPT,
  CREATIVE_STRUCTURE_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  buildSlideContextPrompt,
  buildCreativeStructurePrompt,
} from "./prompts/content-analysis.prompt";
import {
  creativeStructureSchema,
  creativeStructureJsonSchema,
  type CreativeStructureOutput,
} from "../creative-structuring/creative-structuring.schema";
import type { CampaignCreative } from "@/types/database";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const MODEL = () => process.env.OPENAI_MODEL ?? "gpt-4o-mini";

// Step 2 — AI analyzes content (no brand/platform/template sent)
export async function analyzeContent(rawText: string): Promise<ContentAnalysisOutput> {
  if (!rawText.trim()) throw new Error("rawText is empty");

  const response = await getClient().responses.create({
    model: MODEL(),
    input: [
      { role: "system", content: CONTENT_ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: buildAnalysisPrompt(rawText) },
    ],
    text: {
      format: { type: "json_schema", name: "content_analysis", schema: contentAnalysisJsonSchema },
    },
    temperature: 0.3,
  });

  const text = response.output_text;
  if (!text) throw new Error("AI returned empty response");
  return contentAnalysisSchema.parse(JSON.parse(text));
}

// Step 2 — document-with-structure path: AI only analyses metadata, not creative count
export async function analyzeDocumentMeta(rawText: string): Promise<DocumentAnalysisOutput> {
  if (!rawText.trim()) throw new Error("rawText is empty");

  const response = await getClient().responses.create({
    model: MODEL(),
    input: [
      { role: "system", content: DOCUMENT_ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: buildAnalysisPrompt(rawText) },
    ],
    text: {
      format: { type: "json_schema", name: "document_analysis", schema: documentAnalysisJsonSchema },
    },
    temperature: 0.3,
  });

  const text = response.output_text;
  if (!text) throw new Error("AI returned empty response");
  return documentAnalysisSchema.parse(JSON.parse(text));
}

// Step 3 — AI structures creatives from content (count already decided by Step 2)
export async function generateCreativeList(
  rawText: string,
  count: number
): Promise<CreativeStructureOutput> {
  if (!rawText.trim()) throw new Error("rawText is empty");

  const response = await getClient().responses.create({
    model: MODEL(),
    input: [
      { role: "system", content: CREATIVE_STRUCTURE_SYSTEM_PROMPT },
      { role: "user", content: buildCreativeStructurePrompt(rawText, count) },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "creative_structure",
        schema: creativeStructureJsonSchema,
      },
    },
    temperature: 0.5,
  });

  const text = response.output_text;
  if (!text) throw new Error("AI returned empty response");
  return creativeStructureSchema.parse(JSON.parse(text));
}

// Step 4 — AI describes only the visual scene (no colors/layout/branding)
export async function generateSlideContext(creative: Pick<CampaignCreative, "title" | "subtitle" | "body" | "key_takeaway">): Promise<string> {
  const response = await getClient().responses.create({
    model: MODEL(),
    input: [
      { role: "system", content: SLIDE_CONTEXT_SYSTEM_PROMPT },
      { role: "user", content: buildSlideContextPrompt(creative) },
    ],
    temperature: 0.7,
  });

  const context = response.output_text?.trim();
  if (!context) throw new Error("AI returned empty slide context");
  return context;
}
