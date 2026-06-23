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

export const TEMPLATES = [
  {
    id: "corporate-left-hero",
    name: "Corporate Left Hero",
    description: "Professional layout with left-aligned hero text and branding.",
    category: "Corporate",
    preview: "left-hero",
  },
  {
    id: "centered-statement",
    name: "Centered Statement",
    description: "Bold centered text for impactful statements and quotes.",
    category: "Marketing",
    preview: "centered",
  },
  {
    id: "minimal-saas",
    name: "Minimal SaaS",
    description: "Clean and modern layout suited for technology brands.",
    category: "Technology",
    preview: "minimal",
  },
  {
    id: "government",
    name: "Government",
    description: "Formal and structured layout for government communications.",
    category: "Government",
    preview: "structured",
  },
] as const;
