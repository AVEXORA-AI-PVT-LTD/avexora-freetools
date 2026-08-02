/**
 * Curated font pairings (spec 22 §3.3).
 *
 * Every family here is available under the SIL Open Font License, so anything
 * the engine generates is safe to embed in a customer's print PDF and safe to
 * ship commercially. Claude selects a pairing by id; it cannot name an
 * arbitrary font.
 *
 * `stack` is the CSS fallback chain used for screen preview. `pdfFile` is the
 * TTF the PDF renderer embeds — see `engine/render/font-loader.ts`.
 */

export interface FontFace {
  family: string;
  stack: string;
  /** Filename under `public/studio/fonts/`, if bundled for PDF embedding. */
  pdfFile?: string;
  weights: { regular: number; bold: number };
}

export interface FontPair {
  id: string;
  name: string;
  heading: FontFace;
  body: FontFace;
  moods: string[];
  /** Extra tracking for headings, in em. Display faces need less. */
  headingTracking: number;
}

const inter: FontFace = {
  family: "Inter",
  stack: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  weights: { regular: 400, bold: 700 },
};

const sourceSerif: FontFace = {
  family: "Source Serif 4",
  stack: "'Source Serif 4', Georgia, 'Times New Roman', serif",
  weights: { regular: 400, bold: 700 },
};

const spaceGrotesk: FontFace = {
  family: "Space Grotesk",
  stack: "'Space Grotesk', 'Inter', system-ui, sans-serif",
  weights: { regular: 400, bold: 700 },
};

const ibmPlexSans: FontFace = {
  family: "IBM Plex Sans",
  stack: "'IBM Plex Sans', system-ui, sans-serif",
  weights: { regular: 400, bold: 600 },
};

const ibmPlexSerif: FontFace = {
  family: "IBM Plex Serif",
  stack: "'IBM Plex Serif', Georgia, serif",
  weights: { regular: 400, bold: 600 },
};

const dmSans: FontFace = {
  family: "DM Sans",
  stack: "'DM Sans', system-ui, sans-serif",
  weights: { regular: 400, bold: 700 },
};

const playfair: FontFace = {
  family: "Playfair Display",
  stack: "'Playfair Display', Georgia, serif",
  weights: { regular: 400, bold: 700 },
};

const workSans: FontFace = {
  family: "Work Sans",
  stack: "'Work Sans', system-ui, sans-serif",
  weights: { regular: 400, bold: 600 },
};

const libreBaskerville: FontFace = {
  family: "Libre Baskerville",
  stack: "'Libre Baskerville', Georgia, serif",
  weights: { regular: 400, bold: 700 },
};

const jetBrainsMono: FontFace = {
  family: "JetBrains Mono",
  stack: "'JetBrains Mono', ui-monospace, monospace",
  weights: { regular: 400, bold: 700 },
};

export const FONT_PAIRS: FontPair[] = [
  {
    id: "inter-inter",
    name: "Inter / Inter",
    heading: inter,
    body: inter,
    moods: ["modern", "neutral", "professional", "technical"],
    headingTracking: -0.02,
  },
  {
    id: "space-inter",
    name: "Space Grotesk / Inter",
    heading: spaceGrotesk,
    body: inter,
    moods: ["modern", "technical", "distinctive", "creative"],
    headingTracking: -0.015,
  },
  {
    id: "playfair-worksans",
    name: "Playfair Display / Work Sans",
    heading: playfair,
    body: workSans,
    moods: ["premium", "elegant", "traditional", "distinctive"],
    headingTracking: 0,
  },
  {
    id: "plexserif-plexsans",
    name: "IBM Plex Serif / IBM Plex Sans",
    heading: ibmPlexSerif,
    body: ibmPlexSans,
    moods: ["established", "authoritative", "serious", "trustworthy"],
    headingTracking: -0.005,
  },
  {
    id: "dmsans-dmsans",
    name: "DM Sans / DM Sans",
    heading: dmSans,
    body: dmSans,
    moods: ["approachable", "modern", "clean", "friendly"],
    headingTracking: -0.02,
  },
  {
    id: "baskerville-inter",
    name: "Libre Baskerville / Inter",
    heading: libreBaskerville,
    body: inter,
    moods: ["traditional", "authoritative", "premium", "grounded"],
    headingTracking: 0,
  },
  {
    id: "sourceserif-inter",
    name: "Source Serif / Inter",
    heading: sourceSerif,
    body: inter,
    moods: ["editorial", "trustworthy", "calm", "professional"],
    headingTracking: 0,
  },
  {
    id: "jetbrains-inter",
    name: "JetBrains Mono / Inter",
    heading: jetBrainsMono,
    body: inter,
    moods: ["technical", "engineering", "precise", "modern"],
    headingTracking: -0.03,
  },
];

const byId = new Map(FONT_PAIRS.map((f) => [f.id, f]));

export function getFontPair(id: string): FontPair {
  return byId.get(id) ?? FONT_PAIRS[0];
}

export const FONT_PAIR_IDS = FONT_PAIRS.map((f) => f.id);

/** Google Fonts families used, for the preview stylesheet link. */
export function googleFontsHref(pair: FontPair): string {
  const families = Array.from(
    new Set([pair.heading.family, pair.body.family]),
  ).map(
    (family) =>
      `family=${family.replace(/ /g, "+")}:wght@400;500;600;700`,
  );
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

/** Deterministic fallback ranking when the AI curator is unavailable. */
export function rankFontPairs(moods: string[]): FontPair[] {
  const wanted = moods.map((m) => m.toLowerCase());
  return [...FONT_PAIRS]
    .map((f) => ({
      f,
      score: f.moods.filter((m) => wanted.includes(m)).length,
    }))
    .sort((a, b) => b.score - a.score || a.f.id.localeCompare(b.f.id))
    .map((x) => x.f);
}
