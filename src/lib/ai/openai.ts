import OpenAI from "openai";
import type { AIOutput } from "@/types/database";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
}

const SYSTEM_PROMPT = `You are a creative content strategist. Transform raw content into structured creative assets for social media.

Given the user's content, target platform, dimensions, and template preference, you must:
1. Analyze the content to understand its core message and audience
2. Generate a document title, subtitle, and summary
3. Determine the creative count and creative type — choose from: single_post, multi_post, carousel
   - A single_image is valid for one slide
   - Two images are valid
   - Ten images are valid
   - Do not default to carousel — match the content
4. Generate slide-by-slide structure with each slide having:
   - slide_number
   - title
   - subtitle
   - body
   - key_takeaway

Respond only with valid JSON that matches the output schema exactly.`;

export async function generateCreativeStructure(params: {
  content: string;
  platform: string;
  dimension: string;
  template: string;
}): Promise<AIOutput> {
  const userPrompt = `Platform: ${params.platform}
Dimension: ${params.dimension}
Template: ${params.template}

Content:
${params.content}`;

  const response = await getClient().responses.create({
    model: "gpt-5-mini",
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "creative_output",
        schema: {
          type: "object",
          properties: {
            document: {
              type: "object",
              properties: {
                title: { type: "string" },
                subtitle: { type: "string" },
                summary: { type: "string" },
              },
              required: ["title", "subtitle", "summary"],
              additionalProperties: false,
            },
            creative_set: {
              type: "object",
              properties: {
                creative_count: { type: "number" },
                creative_type: {
                  type: "string",
                  enum: ["single_post", "multi_post", "carousel"],
                },
              },
              required: ["creative_count", "creative_type"],
              additionalProperties: false,
            },
            slides: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  slide_number: { type: "number" },
                  title: { type: "string" },
                  subtitle: { type: "string" },
                  body: { type: "string" },
                  key_takeaway: { type: "string" },
                },
                required: [
                  "slide_number",
                  "title",
                  "subtitle",
                  "body",
                  "key_takeaway",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["document", "creative_set", "slides"],
          additionalProperties: false,
        },
      },
    },
    temperature: 0.7,
  });

  const text = response.output_text;

  if (!text) {
    throw new Error("OpenAI returned empty response");
  }

  const parsed: AIOutput = JSON.parse(text);
  return parsed;
}
