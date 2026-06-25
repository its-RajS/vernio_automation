import { z } from "zod";

export const creativeItemSchema = z.object({
  creative_number: z.number().int().positive(),
  title: z.string(),
  subtitle: z.string(),
  body: z.string(),
  key_takeaway: z.string(),
});

export const creativeStructureSchema = z.object({
  creatives: z.array(creativeItemSchema),
});

export type CreativeItem = z.infer<typeof creativeItemSchema>;
export type CreativeStructureOutput = z.infer<typeof creativeStructureSchema>;

export const creativeStructureJsonSchema = {
  type: "object",
  properties: {
    creatives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          creative_number: { type: "number" },
          title: { type: "string" },
          subtitle: { type: "string" },
          body: { type: "string" },
          key_takeaway: { type: "string" },
        },
        required: ["creative_number", "title", "subtitle", "body", "key_takeaway"],
        additionalProperties: false,
      },
    },
  },
  required: ["creatives"],
  additionalProperties: false,
} as const;
