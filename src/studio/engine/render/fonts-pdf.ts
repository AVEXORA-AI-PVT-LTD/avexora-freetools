import { StandardFonts } from "pdf-lib";

/**
 * Font resolution for the PDF renderer.
 *
 * pdf-lib can embed any TTF via fontkit, but shipping ~10 Google Font families
 * would add several MB to the repo for an MVP. So:
 *
 *   - By default each curated family maps to its closest PDF standard face
 *     (Helvetica / Times / Courier), which every PDF reader has built in. Print
 *     output is always correct and never depends on network access.
 *   - If a matching TTF is dropped into `public/studio/fonts/`, the renderer
 *     embeds it instead and the PDF matches the on-screen preview exactly.
 *
 * The tradeoff is deliberate and visible: without the TTFs, a Playfair Display
 * heading prints as Times Bold. `fontFidelity()` reports which happened so the
 * UI can tell the user rather than silently substituting.
 */

export interface ResolvedFont {
  /** Standard-14 name, used when no TTF is available. */
  standard: (typeof StandardFonts)[keyof typeof StandardFonts];
  /** Filename to look for under `public/studio/fonts/`. */
  file?: string;
  /** True when the substitute is a different typeface class than intended. */
  substituted: boolean;
}

type Family = "sans" | "serif" | "mono";

const FAMILY_CLASS: Record<string, Family> = {
  Inter: "sans",
  "DM Sans": "sans",
  "Work Sans": "sans",
  "IBM Plex Sans": "sans",
  "Space Grotesk": "sans",
  "Source Serif 4": "serif",
  "IBM Plex Serif": "serif",
  "Playfair Display": "serif",
  "Libre Baskerville": "serif",
  "JetBrains Mono": "mono",
};

const STANDARD: Record<Family, { regular: StandardFonts; bold: StandardFonts }> = {
  sans: { regular: StandardFonts.Helvetica, bold: StandardFonts.HelveticaBold },
  serif: { regular: StandardFonts.TimesRoman, bold: StandardFonts.TimesRomanBold },
  mono: { regular: StandardFonts.Courier, bold: StandardFonts.CourierBold },
};

/** Strip a CSS stack down to its first family name. */
export function primaryFamily(stack: string): string {
  const first = stack.split(",")[0] ?? "";
  return first.trim().replace(/^['"]|['"]$/g, "");
}

export function resolveFont(stack: string, bold: boolean): ResolvedFont {
  const family = primaryFamily(stack);
  const cls = FAMILY_CLASS[family] ?? "sans";
  const weightSuffix = bold ? "Bold" : "Regular";
  return {
    standard: bold ? STANDARD[cls].bold : STANDARD[cls].regular,
    file: `${family.replace(/\s+/g, "")}-${weightSuffix}.ttf`,
    substituted: !isStandardEquivalent(family),
  };
}

/** Families whose standard-14 substitute is visually equivalent. */
function isStandardEquivalent(family: string): boolean {
  return family === "Helvetica" || family === "Times New Roman" || family === "Courier";
}

export function fontFidelity(embeddedFiles: string[], requested: string[]): {
  exact: boolean;
  substituted: string[];
} {
  const substituted = requested.filter(
    (family) =>
      !embeddedFiles.some((f) => f.startsWith(family.replace(/\s+/g, ""))),
  );
  return { exact: substituted.length === 0, substituted };
}
