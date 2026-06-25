import { z } from "zod";

export const contentAnalysisSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  content_type: z.string().min(1),
  recommended_creative_count: z.number().int().positive(),
  creative_type: z.enum(["single_post", "multi_post", "carousel"]),
  tone: z.string().min(1),
  key_topics: z.array(z.string()),
  target_audience: z.string().min(1),
});

export type ContentAnalysisOutput = z.infer<typeof contentAnalysisSchema>;

export const contentAnalysisJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    content_type: { type: "string" },
    recommended_creative_count: { type: "number" },
    creative_type: { type: "string", enum: ["single_post", "multi_post", "carousel"] },
    tone: { type: "string" },
    key_topics: { type: "array", items: { type: "string" } },
    target_audience: { type: "string" },
  },
  required: [
    "title",
    "summary",
    "content_type",
    "recommended_creative_count",
    "creative_type",
    "tone",
    "key_topics",
    "target_audience",
  ],
  additionalProperties: false,
} as const;

export const documentAnalysisSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  content_type: z.string().min(1),
  tone: z.string().min(1),
  key_topics: z.array(z.string()),
  target_audience: z.string().min(1),
});

export type DocumentAnalysisOutput = z.infer<typeof documentAnalysisSchema>;

export const documentAnalysisJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    content_type: { type: "string" },
    tone: { type: "string" },
    key_topics: { type: "array", items: { type: "string" } },
    target_audience: { type: "string" },
  },
  required: ["title", "summary", "content_type", "tone", "key_topics", "target_audience"],
  additionalProperties: false,
} as const;
