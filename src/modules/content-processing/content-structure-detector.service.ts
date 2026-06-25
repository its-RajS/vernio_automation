export interface DetectedSlide {
  slide_number: number;
  title: string;
  subtitle: string;
  body: string;
  key_takeaway: string;
}

export interface StructureDetectionResult {
  hasStructure: boolean;
  count: number;
  pattern: string;
  slides: DetectedSlide[];
}

const PATTERNS = [
  { source: "^slide\\s+(\\d+)\\s*:", name: "slide" },
  { source: "^page\\s+(\\d+)\\s*:", name: "page" },
  { source: "^creative\\s+(\\d+)\\s*:", name: "creative" },
  { source: "^section\\s+(\\d+)\\s*:", name: "section" },
  { source: "^post\\s+(\\d+)\\s*:", name: "post" },
];

export function detectStructure(rawText: string): StructureDetectionResult {
  for (const { source, name } of PATTERNS) {
    const regex = new RegExp(source, "gim");
    const matches = [...rawText.matchAll(regex)];

    if (matches.length >= 2) {
      return {
        hasStructure: true,
        count: matches.length,
        pattern: name,
        slides: parseSlides(rawText, matches),
      };
    }
  }

  return { hasStructure: false, count: 0, pattern: "", slides: [] };
}

function parseSlides(
  rawText: string,
  matches: RegExpMatchArray[]
): DetectedSlide[] {
  return matches.map((match, i) => {
    const contentStart = match.index! + match[0].length;
    const contentEnd =
      i < matches.length - 1 ? matches[i + 1].index! : rawText.length;
    const content = rawText.slice(contentStart, contentEnd).trim();

    const lines = content
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    const title = lines[0] ?? "";
    const subtitle = lines.length > 1 ? lines[1] : "";

    const ktIdx = lines.findIndex((l) =>
      /^key[\s_-]?takeaway\s*:?/i.test(l)
    );

    let body: string;
    let key_takeaway: string;

    if (ktIdx >= 2) {
      body = lines.slice(2, ktIdx).join("\n");
      const ktInline = lines[ktIdx]
        .replace(/^key[\s_-]?takeaway\s*:?\s*/i, "")
        .trim();
      key_takeaway = ktInline || lines[ktIdx + 1] || "";
    } else {
      body = lines.slice(2).join("\n");
      key_takeaway = "";
    }

    return {
      slide_number: parseInt(match[1], 10),
      title,
      subtitle,
      body,
      key_takeaway,
    };
  });
}
