import type { BrandTokens } from "../tokens";
import { composeLogo, type LogoVariant } from "../logo";
import { type Element, type TextStyle, svg, text } from "../doc-spec";

/**
 * Helpers shared by the asset layouts.
 *
 * Layouts are pure functions — they take tokens plus content and return a
 * DocSpec. Anything that would otherwise be copy-pasted between them (logo
 * placement, type styles, the statutory footer) lives here so a typographic
 * change lands everywhere at once.
 */

export interface PlacedLogo {
  element: Element;
  width: number;
  height: number;
}

/**
 * Place the logo into a box of a given width, preserving aspect ratio.
 * Returns the element plus its real height so callers can flow content below.
 */
export function placeLogo(
  tokens: BrandTokens,
  opts: {
    x: number;
    y: number;
    width: number;
    variant?: LogoVariant;
    layout?: BrandTokens["logoLayout"];
  },
): PlacedLogo {
  const logo = composeLogo(tokens, {
    variant: opts.variant,
    layout: opts.layout,
  });
  const height = (logo.height / logo.width) * opts.width;
  return {
    element: svg({
      x: opts.x,
      y: opts.y,
      w: opts.width,
      h: height,
      viewBox: logo.viewBox,
      content: logo.content,
    }),
    width: opts.width,
    height,
  };
}

/** Type styles derived from the brand tokens, in the document's units. */
export function styles(tokens: BrandTokens, unit: "mm" | "px" = "mm") {
  const s = unit === "mm" ? 1 : 4; // px layouts are ~4× the mm type scale
  const { fonts, palette, ramp, scale } = tokens;

  const base = (
    fontSize: number,
    overrides: Partial<TextStyle> = {},
  ): TextStyle => ({
    fontFamily: fonts.body.stack,
    fontSize: fontSize * s,
    fontWeight: 400,
    color: palette.ink,
    lineHeight: 1.4,
    wrap: true,
    ...overrides,
  });

  return {
    heading: base(scale.heading, {
      fontFamily: fonts.heading.stack,
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: scale.heading * s * fonts.headingTracking,
    }),
    subheading: base(scale.body * 1.25, {
      fontFamily: fonts.heading.stack,
      fontWeight: 600,
      lineHeight: 1.25,
    }),
    body: base(scale.body),
    small: base(scale.small, { color: ramp.subtleInk }),
    micro: base(scale.micro, { color: ramp.subtleInk, lineHeight: 1.5 }),
    label: base(scale.micro, {
      fontWeight: 600,
      color: ramp.subtleInk,
      letterSpacing: scale.micro * s * 0.08,
      transform: "uppercase" as const,
    }),
  };
}

export type LayoutStyles = ReturnType<typeof styles>;

/**
 * The statutory particulars block. Returns the elements and the height
 * consumed, so a layout can anchor it to the page foot.
 */
export function statutoryBlock(
  lines: string[],
  opts: {
    x: number;
    y: number;
    width: number;
    style: TextStyle;
    align?: "left" | "center";
  },
): { elements: Element[]; height: number } {
  if (lines.length === 0) return { elements: [], height: 0 };

  const lineHeight = opts.style.fontSize * (opts.style.lineHeight ?? 1.5);
  const elements = lines.map((lineText, i) =>
    text({
      x: opts.x,
      y: opts.y + i * lineHeight,
      w: opts.width,
      text: lineText,
      style: {
        ...opts.style,
        align: opts.align ?? "left",
        // The footer must stay legible at small print sizes; never wrap it
        // into a second line silently.
        wrap: false,
      },
    }),
  );

  return { elements, height: lines.length * lineHeight };
}

/** Standard document sizes, in mm. */
export const PAGE_SIZES = {
  a4: { w: 210, h: 297 },
  a5: { w: 148, h: 210 },
  /** India-standard visiting card. */
  businessCard: { w: 89, h: 54 },
  /** ISO/IEC 7810 ID-1 — the credit-card / employee-badge size. */
  cr80: { w: 85.6, h: 54 },
  envelopeDl: { w: 220, h: 110 },
  envelopeC5: { w: 229, h: 162 },
  envelopeC4: { w: 324, h: 229 },
} as const;

/** Screen sizes, in px. */
export const SCREEN_SIZES = {
  square: { w: 1080, h: 1080 },
  portrait: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
  og: { w: 1200, h: 630 },
  metaFeed: { w: 1200, h: 628 },
  displayMedRect: { w: 300, h: 250 },
  displayLeaderboard: { w: 728, h: 90 },
  displaySkyscraper: { w: 160, h: 600 },
} as const;

/** Print bleed and safe margin, in mm — the values Indian printers expect. */
export const PRINT_BLEED = 3;
export const PRINT_SAFE = 4;
