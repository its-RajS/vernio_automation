// AI receives ONLY raw text — no brand/platform/template
export const CONTENT_ANALYSIS_SYSTEM_PROMPT = `You are a content strategist. Analyze the provided content and return a structured JSON analysis.

Determine:
- title: a concise title that captures the core message
- summary: 2-3 sentence summary of what this content is about
- content_type: one of: educational, announcement, case_study, thought_leadership, product_update, industry_insight, event
- recommended_creative_count: number of social media creatives this content warrants (1-10)
- creative_type: single_post (1 creative), multi_post (2-4 independent posts), or carousel (5+ sequential slides)
- tone: communication tone — one of: professional, inspirational, informative, urgent, conversational, authoritative
- key_topics: array of 3-7 key topics or themes
- target_audience: who this content is for

Base your analysis strictly on the provided content. Return only valid JSON matching the schema exactly.`;

export const DOCUMENT_ANALYSIS_SYSTEM_PROMPT = `You are a content strategist. Analyze the provided content and return a structured JSON analysis of the document itself.

The creative structure (slide count, creative type) has already been determined from the document — do NOT include or alter those fields.

Determine only:
- title: a concise title that captures the core message
- summary: 2-3 sentence summary of what this content is about
- content_type: one of: educational, announcement, case_study, thought_leadership, product_update, industry_insight, event
- tone: communication tone — one of: professional, inspirational, informative, urgent, conversational, authoritative
- key_topics: array of 3-7 key topics or themes
- target_audience: who this content is for

Base your analysis strictly on the provided content. Return only valid JSON matching the schema exactly.`;

export const SLIDE_CONTEXT_SYSTEM_PROMPT = `Describe only the visual scene represented by this creative.

Do not mention:
- colors
- typography
- layout
- dimensions
- branding
- company names
- image quality
- camera settings

Describe only the objects, relationships, and visual story.

Return only one paragraph.`;

export const CREATIVE_STRUCTURE_SYSTEM_PROMPT = `You are a content strategist. Given raw content and a target creative count, generate exactly that many structured creatives.

Each creative must have:
- creative_number: sequential integer starting at 1
- title: short, punchy headline
- subtitle: one supporting line
- body: the main content for this creative (2-4 sentences)
- key_takeaway: the single most important message

Return only valid JSON matching the schema exactly. Generate EXACTLY the number of creatives specified.`;

export function buildAnalysisPrompt(rawText: string): string {
  return `Content:\n${rawText}`;
}

export function buildSlideContextPrompt(params: {
  title: string;
  subtitle: string;
  body: string;
  key_takeaway: string;
}): string {
  return `Creative title: ${params.title}
Subtitle: ${params.subtitle || "none"}
Body: ${params.body || "none"}
Key takeaway: ${params.key_takeaway || "none"}`;
}

export function buildCreativeStructurePrompt(rawText: string, count: number): string {
  return `Generate exactly ${count} creative(s) from this content:

${rawText}`;
}
