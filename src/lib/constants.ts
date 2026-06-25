import type { Platform, Dimension } from "@/types/database";

export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X" },
];

export const DIMENSIONS: { value: Dimension; label: string; description: string }[] = [
  { value: "1080x1080", label: "1080 × 1080", description: "Square" },
  { value: "1080x1350", label: "1080 × 1350", description: "Portrait" },
  { value: "1080x1920", label: "1080 × 1920", description: "Story / Reel" },
  { value: "custom", label: "Custom", description: "Custom dimensions" },
];

export type TemplateConstraints = {
  // Injected at the TOP of the final prompt — takes precedence over brand/scene.
  imageInstruction: string;
  // Appended to the negative prompt — blocks the model from violating the zone.
  negativeAddendum: string;
  // Where text will render (for future text renderer).
  textZone: string;
};

export const TEMPLATES = [
  // ─── LEFT / RIGHT SPLIT ──────────────────────────────────────────────────
  {
    id: "editorial-left",
    name: "Editorial Left",
    description: "Text on left, visual subject on right. Classic editorial layout for corporate posts.",
    category: "Corporate",
    preview: "editorial-left",
    platforms: ["linkedin", "facebook"],
    bestFor: ["1080x1080", "1080x1350"],
    constraints: {
      imageInstruction: `
STRICT LAYOUT RULE — THIS OVERRIDES ALL OTHER COMPOSITION INSTRUCTIONS IN THIS PROMPT.

This image is a background for a designed social media post. Text will be rendered on top of the left side of this image. The left zone must be completely clear of any visual content.

LEFT ZONE — TEXT SAFE AREA (left 40% of canvas width):
- This area must contain ONLY a solid, uniform dark background color.
- No objects, icons, shapes, glows, reflections, particles, shadows, or gradients from any subject matter may appear here.
- No depth-of-field bokeh, light leaks, or atmospheric haze from the right side may bleed into this zone.
- The background in this zone must be flat, clean, and uniformly dark — suitable for white text overlay.

RIGHT ZONE — VISUAL AREA (right 60% of canvas width):
- ALL subject matter must be fully contained within the right 60%.
- The visual composition must be right-aligned and right-heavy.
- Subjects should face or lean slightly left, toward the text zone.
- Use cinematic depth-of-field: sharpest focus at the far right, gradually softening toward the 60% boundary.
- Natural vignetting or fade toward the 60% boundary is acceptable, but must not cross into the left zone.

DO NOT center the composition. DO NOT place any element in the left 40%.`.trim(),
      negativeAddendum: "No visual elements in left 40% of image. No objects on left side. No centered composition.",
      textZone: "left 40%, vertically centered",
    } satisfies TemplateConstraints,
  },
  {
    id: "editorial-right",
    name: "Editorial Right",
    description: "Text on right, visual subject on left. Mirror of Editorial Left.",
    category: "Corporate",
    preview: "editorial-right",
    platforms: ["linkedin", "facebook"],
    bestFor: ["1080x1080", "1080x1350"],
    constraints: {
      imageInstruction: `
STRICT LAYOUT RULE — THIS OVERRIDES ALL OTHER COMPOSITION INSTRUCTIONS IN THIS PROMPT.

This image is a background for a designed social media post. Text will be rendered on top of the right side of this image. The right zone must be completely clear of any visual content.

RIGHT ZONE — TEXT SAFE AREA (right 40% of canvas width):
- This area must contain ONLY a solid, uniform dark background color.
- No objects, icons, shapes, glows, reflections, particles, shadows, or gradients from any subject matter may appear here.
- No depth-of-field bokeh, light leaks, or atmospheric haze from the left side may bleed into this zone.
- The background in this zone must be flat, clean, and uniformly dark — suitable for white text overlay.

LEFT ZONE — VISUAL AREA (left 60% of canvas width):
- ALL subject matter must be fully contained within the left 60%.
- The visual composition must be left-aligned and left-heavy.
- Subjects should face or lean slightly right, toward the text zone.
- Use cinematic depth-of-field: sharpest focus at the far left, gradually softening toward the 60% boundary.
- Natural vignetting or fade toward the 60% boundary is acceptable, but must not cross into the right zone.

DO NOT center the composition. DO NOT place any element in the right 40%.`.trim(),
      negativeAddendum: "No visual elements in right 40% of image. No objects on right side. No centered composition.",
      textZone: "right 40%, vertically centered",
    } satisfies TemplateConstraints,
  },

  // ─── TOP / BOTTOM SPLIT ──────────────────────────────────────────────────
  {
    id: "top-title",
    name: "Top Title",
    description: "Headline at top, full visual below. Strong for announcements and feature posts.",
    category: "Marketing",
    preview: "top-title",
    platforms: ["instagram", "linkedin", "facebook"],
    bestFor: ["1080x1080", "1080x1350"],
    constraints: {
      imageInstruction: `
STRICT LAYOUT RULE — THIS OVERRIDES ALL OTHER COMPOSITION INSTRUCTIONS IN THIS PROMPT.

This image is a background for a designed post. Text will be rendered on top of the upper portion. The top zone must be completely clear.

TOP ZONE — TEXT SAFE AREA (top 32% of canvas height):
- This area must contain ONLY a solid, uniform dark background color.
- No objects, shapes, glows, particles, or any visual elements may appear here.
- A very subtle top-to-transparent gradient of the background color is acceptable, but no subject matter.
- Must be flat enough for white headline text overlay.

BOTTOM ZONE — VISUAL AREA (bottom 68% of canvas height):
- ALL subject matter must be fully contained in the bottom 68%.
- Composition is bottom-heavy with strong upward visual energy toward the text zone.
- Use cinematic depth with sharp focus in the lower section, softening toward the 32% boundary.

DO NOT place any subject matter in the top 32%.`.trim(),
      negativeAddendum: "No visual elements in top 32% of image. No objects at top. Composition must be bottom-heavy.",
      textZone: "top 32%, full width",
    } satisfies TemplateConstraints,
  },
  {
    id: "bottom-caption",
    name: "Bottom Caption",
    description: "Visual fills top, caption area at bottom. Ideal for image-first storytelling.",
    category: "Marketing",
    preview: "bottom-caption",
    platforms: ["instagram", "linkedin", "facebook", "x"],
    bestFor: ["1080x1080", "1080x1350"],
    constraints: {
      imageInstruction: `
STRICT LAYOUT RULE — THIS OVERRIDES ALL OTHER COMPOSITION INSTRUCTIONS IN THIS PROMPT.

This image is a background for a designed post. Text will be rendered on top of the lower portion. The bottom zone must be completely clear.

BOTTOM ZONE — TEXT SAFE AREA (bottom 32% of canvas height):
- This area must darken naturally — either a solid dark color or an organic gradient fade from the visual above.
- No objects, shapes, or key visual elements may appear in this zone.
- A natural downward gradient fade from the image into the dark bottom zone is preferred and looks cinematic.
- Must be dark enough for white caption text overlay.

TOP ZONE — VISUAL AREA (top 68% of canvas height):
- ALL primary subject matter must be fully contained in the top 68%.
- Composition is top-heavy. Subjects should have downward visual gravity or weight.
- The image naturally settles and darkens toward the lower zone.

DO NOT place any subject matter in the bottom 32%.`.trim(),
      negativeAddendum: "No visual elements in bottom 32% of image. No objects at bottom. Composition must be top-heavy.",
      textZone: "bottom 32%, full width",
    } satisfies TemplateConstraints,
  },

  // ─── CENTER BAND ─────────────────────────────────────────────────────────
  {
    id: "center-statement",
    name: "Center Statement",
    description: "Bold text in center horizontal band, visual frames top and bottom. For quotes and bold statements.",
    category: "Marketing",
    preview: "center-statement",
    platforms: ["instagram", "linkedin", "facebook", "x"],
    bestFor: ["1080x1080"],
    constraints: {
      imageInstruction: `
STRICT LAYOUT RULE — THIS OVERRIDES ALL OTHER COMPOSITION INSTRUCTIONS IN THIS PROMPT.

This image is a background for a quote or statement post. Text will be rendered across the center horizontal band. That band must be completely clear.

CENTER BAND — TEXT SAFE AREA (from 32% to 68% of canvas height, full width):
- This horizontal band must contain ONLY a solid, uniform dark background.
- No objects, shapes, glows, or visual content of any kind may appear here.
- The band must be flat and dark enough for large white text overlay.
- Width: full canvas. Height: from 32% to 68% of the total canvas height.

TOP FRAME — VISUAL AREA (top 32% of canvas height):
- Place decorative visual elements here only.
- Balanced and symmetrical composition in the top third.

BOTTOM FRAME — VISUAL AREA (bottom 32% of canvas height):
- Place decorative visual elements here only.
- Balanced and symmetrical composition in the bottom third.
- Must be visually complementary to the top frame.

The overall composition must feel like a frame around the empty center band. DO NOT place any visual in the center band.`.trim(),
      negativeAddendum: "No visual elements in horizontal center band (32% to 68% of height). Center must be dark and empty.",
      textZone: "center band, 32%–68% height, full width",
    } satisfies TemplateConstraints,
  },

  // ─── STORY / REEL (9:16) ─────────────────────────────────────────────────
  {
    id: "story-top",
    name: "Story — Top Text",
    description: "Text at top, rich visual below. Optimized for 9:16 Stories and Reels.",
    category: "Social",
    preview: "story-top",
    platforms: ["instagram", "facebook"],
    bestFor: ["1080x1920"],
    constraints: {
      imageInstruction: `
STRICT LAYOUT RULE — THIS OVERRIDES ALL OTHER COMPOSITION INSTRUCTIONS IN THIS PROMPT.

This is a 9:16 vertical format (Story/Reel). Text will be rendered at the very top. The top zone must be completely clear.

TOP ZONE — TEXT SAFE AREA (top 35% of canvas height):
- This area must contain ONLY a solid, uniform dark background color.
- No objects, shapes, glows, or visual elements may appear here.
- Must be flat enough for white headline and subtext overlay.

BOTTOM ZONE — VISUAL AREA (bottom 65% of canvas height):
- ALL subject matter must be fully contained in the bottom 65%.
- The composition must be rich, immersive, and detailed in the bottom zone.
- Strong upward visual energy from subjects, drawing attention toward the text zone above.
- Cinematic depth with maximum detail at the bottom, softening toward the 35% boundary.

DO NOT place any subject matter in the top 35%.`.trim(),
      negativeAddendum: "No visual elements in top 35% of image. Composition must be bottom-heavy for 9:16 story format.",
      textZone: "top 35%, full width",
    } satisfies TemplateConstraints,
  },
  {
    id: "story-bottom",
    name: "Story — Bottom Text",
    description: "Rich visual at top, caption at bottom. Optimized for 9:16 Stories and Reels.",
    category: "Social",
    preview: "story-bottom",
    platforms: ["instagram", "facebook"],
    bestFor: ["1080x1920"],
    constraints: {
      imageInstruction: `
STRICT LAYOUT RULE — THIS OVERRIDES ALL OTHER COMPOSITION INSTRUCTIONS IN THIS PROMPT.

This is a 9:16 vertical format (Story/Reel). Text will be rendered at the very bottom. The bottom zone must be completely clear.

BOTTOM ZONE — TEXT SAFE AREA (bottom 35% of canvas height):
- This area must be dark — either a solid background color or a natural cinematic fade from the visual above.
- No objects or key visual elements may appear here.
- A natural atmospheric fade downward into this zone is preferred.
- Must be dark enough for white text overlay.

TOP ZONE — VISUAL AREA (top 65% of canvas height):
- ALL primary subject matter must be fully contained in the top 65%.
- Composition is immersive and top-heavy.
- Natural downward fade from the visual into the dark bottom zone.

DO NOT place subject matter in the bottom 35%.`.trim(),
      negativeAddendum: "No visual elements in bottom 35% of image. Composition must be top-heavy for 9:16 story format.",
      textZone: "bottom 35%, full width",
    } satisfies TemplateConstraints,
  },

  // ─── FULL BLEED ──────────────────────────────────────────────────────────
  {
    id: "full-bleed-gradient",
    name: "Full Bleed — Gradient",
    description: "Visual fills entire canvas, organic dark gradient at bottom for text. Premium and dramatic.",
    category: "Premium",
    preview: "full-bleed-gradient",
    platforms: ["instagram", "linkedin", "facebook"],
    bestFor: ["1080x1080", "1080x1350", "1080x1920"],
    constraints: {
      imageInstruction: `
STRICT LAYOUT RULE — THIS OVERRIDES ALL OTHER COMPOSITION INSTRUCTIONS IN THIS PROMPT.

This is a full-bleed background image. The visual fills the entire canvas, but the bottom portion must organically darken for text overlay.

BOTTOM TEXT ZONE (bottom 38% of canvas height):
- This zone must darken organically through cinematic shadow, atmospheric depth, or natural depth-of-field blur.
- The darkening must feel like a natural part of the scene — fog, shadow, depth — not a fake gradient overlay.
- No key subjects or objects may appear in this zone.
- By the very bottom of the canvas, the zone must be dark enough for white text.

UPPER VISUAL ZONE (top 62% of canvas height):
- All primary subject matter and visual interest must be in the upper 62%.
- Rich, cinematic composition with maximum detail in the upper portion.
- The image naturally settles and darkens toward the lower zone.

DO NOT place key subjects in the bottom 38%.`.trim(),
      negativeAddendum: "No key subjects in bottom 38% of image. Bottom must be naturally dark for text overlay.",
      textZone: "bottom 38%, full width (gradient dark zone)",
    } satisfies TemplateConstraints,
  },

  // ─── POSTER ──────────────────────────────────────────────────────────────
  {
    id: "poster-classic",
    name: "Poster Classic",
    description: "Dark center band for title and details, visual subjects frame top and bottom. For events and announcements.",
    category: "Poster",
    preview: "poster-classic",
    platforms: ["instagram", "linkedin", "facebook"],
    bestFor: ["1080x1080", "1080x1350"],
    constraints: {
      imageInstruction: `
STRICT LAYOUT RULE — THIS OVERRIDES ALL OTHER COMPOSITION INSTRUCTIONS IN THIS PROMPT.

This is a poster-style background. Text will be rendered across the center. The center band must be completely clear.

CENTER BAND — TEXT SAFE AREA (from 28% to 72% of canvas height, full width):
- This band must be uniformly dark — suitable for large event title text and body copy.
- No objects, shapes, glows, particles, or visual content of any kind may appear here.
- The band must be flat, dark, and clean across its full width.

TOP FRAME — VISUAL AREA (top 28% of canvas):
- Decorative visual subjects here only. Treat as a header graphic.
- Balanced and complementary to the bottom frame.

BOTTOM FRAME — VISUAL AREA (bottom 28% of canvas):
- Decorative visual subjects here only. Treat as a footer graphic.
- Must visually balance the top frame, creating a poster-like framing effect.

Together the top and bottom frames should feel like they bracket the dark center band. DO NOT place anything in the center band.`.trim(),
      negativeAddendum: "No visual elements in center band (28% to 72% height). Center must be uniformly dark for poster text.",
      textZone: "center band, 28%–72% height, full width",
    } satisfies TemplateConstraints,
  },

  // ─── SIDEBAR ─────────────────────────────────────────────────────────────
  {
    id: "sidebar-bold",
    name: "Sidebar Bold",
    description: "Solid left sidebar for text, rich visual fills right side. High contrast, strong branding.",
    category: "Corporate",
    preview: "sidebar-bold",
    platforms: ["linkedin", "facebook"],
    bestFor: ["1080x1080"],
    constraints: {
      imageInstruction: `
STRICT LAYOUT RULE — THIS OVERRIDES ALL OTHER COMPOSITION INSTRUCTIONS IN THIS PROMPT.

This image is a background for a sidebar-style post. Text will be rendered on the left vertical strip. The left strip must be completely clear.

LEFT SIDEBAR — TEXT SAFE AREA (left 35% of canvas width, full height):
- This vertical strip must contain ONLY a solid, flat, uniform dark color.
- No objects, textures, gradients, glows, reflections, or any visual content may appear here.
- There must be a clean, hard-edged visual boundary at the 35% mark where the sidebar meets the visual zone.
- The sidebar must be flat and uniformly dark — suitable for white text from top to bottom.

RIGHT ZONE — VISUAL AREA (right 65% of canvas width):
- ALL subject matter must be fully contained in the right 65%.
- Rich, detailed, and immersive composition on the right side.
- The visual must have a clean edge or natural depth separation at the 35% boundary.
- Subjects should be right-aligned and detailed.

DO NOT place any subject matter in the left 35%. The boundary between sidebar and visual must be sharp.`.trim(),
      negativeAddendum: "No visual elements in left 35% sidebar. Left strip must be solid dark color. No gradient bleed into sidebar.",
      textZone: "left 35%, full height vertical strip",
    } satisfies TemplateConstraints,
  },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];
