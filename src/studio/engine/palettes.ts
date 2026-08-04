import { contrastRatio, darken, lighten, readableOn } from "./color";

/**
 * Curated brand palettes (spec 22 §3.3).
 *
 * These are the *only* colour schemes the engine can produce. Claude selects
 * one by id — it never invents hex values — so every generated brand is
 * guaranteed to pass the contrast assertions in `tests/studio/palettes.test.ts`.
 *
 * `moods` and `industries` drive the deterministic fallback scorer used when
 * ANTHROPIC_API_KEY is absent.
 */

export interface Palette {
  id: string;
  name: string;
  /** Dominant brand colour. Logos and headers use this. */
  primary: string;
  /** Supporting colour for accents and secondary surfaces. */
  secondary: string;
  /** High-emphasis highlight — buttons, small marks. Used sparingly. */
  accent: string;
  /** Page background for print stationery. Near-white by convention. */
  surface: string;
  /** Body text colour on `surface`. */
  ink: string;
  moods: string[];
  industries: string[];
}

export const PALETTES: Palette[] = [
  {
    id: "indigo-slate",
    name: "Indigo Slate",
    primary: "#3730a3",
    secondary: "#475569",
    accent: "#f59e0b",
    surface: "#ffffff",
    ink: "#0f172a",
    moods: ["professional", "trustworthy", "modern"],
    industries: ["saas", "consulting", "finance", "legal"],
  },
  {
    id: "deep-teal",
    name: "Deep Teal",
    primary: "#0f766e",
    secondary: "#334155",
    accent: "#f97316",
    surface: "#ffffff",
    ink: "#0f172a",
    moods: ["calm", "professional", "fresh"],
    industries: ["healthcare", "wellness", "education", "sustainability"],
  },
  {
    id: "royal-navy",
    name: "Royal Navy",
    primary: "#1e3a8a",
    secondary: "#334155",
    accent: "#eab308",
    surface: "#ffffff",
    ink: "#0f172a",
    moods: ["authoritative", "established", "trustworthy"],
    industries: ["finance", "legal", "insurance", "real-estate"],
  },
  {
    id: "crimson-ink",
    name: "Crimson Ink",
    primary: "#be123c",
    secondary: "#1f2937",
    accent: "#0ea5e9",
    surface: "#ffffff",
    ink: "#111827",
    moods: ["bold", "energetic", "confident"],
    industries: ["food", "retail", "media", "fitness"],
  },
  {
    id: "forest-clay",
    name: "Forest & Clay",
    primary: "#166534",
    secondary: "#57534e",
    accent: "#ca8a04",
    surface: "#ffffff",
    ink: "#1c1917",
    moods: ["grounded", "natural", "reliable"],
    industries: ["agriculture", "sustainability", "manufacturing", "logistics"],
  },
  {
    id: "violet-dusk",
    name: "Violet Dusk",
    primary: "#6d28d9",
    secondary: "#4c1d95",
    accent: "#22d3ee",
    surface: "#ffffff",
    ink: "#1e1b4b",
    moods: ["creative", "modern", "premium"],
    industries: ["design", "media", "saas", "entertainment"],
  },
  {
    id: "charcoal-amber",
    name: "Charcoal & Amber",
    primary: "#1f2937",
    secondary: "#4b5563",
    accent: "#d97706",
    surface: "#ffffff",
    ink: "#111827",
    moods: ["minimal", "premium", "serious"],
    industries: ["consulting", "architecture", "legal", "luxury"],
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    primary: "#0369a1",
    secondary: "#0f172a",
    accent: "#14b8a6",
    surface: "#ffffff",
    ink: "#0f172a",
    moods: ["clear", "trustworthy", "approachable"],
    industries: ["saas", "logistics", "travel", "education"],
  },
  {
    id: "saffron-earth",
    name: "Saffron Earth",
    primary: "#c2410c",
    secondary: "#44403c",
    accent: "#0d9488",
    surface: "#ffffff",
    ink: "#1c1917",
    moods: ["warm", "traditional", "energetic"],
    industries: ["food", "hospitality", "retail", "handicrafts"],
  },
  {
    id: "plum-stone",
    name: "Plum & Stone",
    primary: "#86198f",
    secondary: "#3f3f46",
    accent: "#f59e0b",
    surface: "#ffffff",
    ink: "#18181b",
    moods: ["premium", "creative", "distinctive"],
    industries: ["beauty", "fashion", "events", "design"],
  },
  {
    id: "steel-lime",
    name: "Steel & Lime",
    primary: "#334155",
    secondary: "#1e293b",
    accent: "#65a30d",
    surface: "#ffffff",
    ink: "#0f172a",
    moods: ["technical", "modern", "efficient"],
    industries: ["engineering", "manufacturing", "logistics", "construction"],
  },
  {
    id: "maroon-gold",
    name: "Maroon & Gold",
    primary: "#7f1d1d",
    secondary: "#292524",
    accent: "#b45309",
    surface: "#ffffff",
    ink: "#1c1917",
    moods: ["established", "traditional", "premium"],
    industries: ["legal", "education", "hospitality", "jewellery"],
  },
];

const byId = new Map(PALETTES.map((p) => [p.id, p]));

export function getPalette(id: string): Palette {
  return byId.get(id) ?? PALETTES[0];
}

export const PALETTE_IDS = PALETTES.map((p) => p.id);

/** Derived tints/shades so layouts never hand-roll colour maths. */
export function paletteRamp(p: Palette) {
  return {
    primarySoft: lighten(p.primary, 0.88),
    primaryMuted: lighten(p.primary, 0.62),
    primaryDeep: darken(p.primary, 0.25),
    onPrimary: readableOn(p.primary),
    onAccent: readableOn(p.accent),
    onSecondary: readableOn(p.secondary),
    hairline: lighten(p.ink, 0.85),
    subtleInk: lighten(p.ink, 0.42),
  };
}

/**
 * The contract every palette must satisfy. Enforced by unit test rather than
 * documented and hoped for — WCAG AA is 4.5:1 for body text.
 */
export const MIN_BODY_CONTRAST = 4.5;
/** AA large-text / non-text threshold, for the primary-on-surface case. */
export const MIN_LARGE_CONTRAST = 3;

export function auditPalette(p: Palette): string[] {
  const problems: string[] = [];
  if (contrastRatio(p.ink, p.surface) < MIN_BODY_CONTRAST) {
    problems.push(`${p.id}: ink on surface below ${MIN_BODY_CONTRAST}:1`);
  }
  if (contrastRatio(p.primary, p.surface) < MIN_LARGE_CONTRAST) {
    problems.push(`${p.id}: primary on surface below ${MIN_LARGE_CONTRAST}:1`);
  }
  const ramp = paletteRamp(p);
  if (contrastRatio(ramp.onPrimary, p.primary) < MIN_BODY_CONTRAST) {
    problems.push(`${p.id}: no readable text colour on primary`);
  }
  if (contrastRatio(ramp.onAccent, p.accent) < MIN_BODY_CONTRAST) {
    problems.push(`${p.id}: no readable text colour on accent`);
  }
  return problems;
}

/**
 * Deterministic palette scoring — the fallback when the AI curator is
 * unavailable. Returns palettes ranked by how well their tags match the brief.
 */
export function rankPalettes(industry: string, moods: string[]): Palette[] {
  const wanted = moods.map((m) => m.toLowerCase());
  const ind = industry.toLowerCase();
  return [...PALETTES]
    .map((p) => {
      const industryHit = p.industries.some((i) => ind.includes(i) || i.includes(ind))
        ? 2
        : 0;
      const moodHits = p.moods.filter((m) => wanted.includes(m)).length;
      return { p, score: industryHit + moodHits };
    })
    .sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id))
    .map((x) => x.p);
}
