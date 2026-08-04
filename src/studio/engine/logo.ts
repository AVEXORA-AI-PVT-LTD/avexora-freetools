import type { BrandTokens, LogoLayout } from "./tokens";
import { escapeXml, generateMark } from "./marks";
import { readableOn } from "./color";

/**
 * Logo composition (spec 22 §3.3).
 *
 * `composeLogo` is a pure function of the brand tokens — same tokens, same
 * variant, byte-identical SVG. That determinism is asserted by
 * `tests/studio/logo.test.ts` and is what lets a customer re-download an
 * identical logo months later without us storing any image bytes.
 *
 * Text is emitted as `<text>` with a font-family, not as outlines. This keeps
 * the SVG small and editable; the PDF renderer embeds the real font so print
 * output does not depend on the viewer having it installed.
 */

export type LogoVariant = "full" | "mono-dark" | "mono-light" | "reversed";

export interface ComposedLogo {
  svg: string;
  /** Inner markup and viewBox, for embedding into a DocSpec `svg` element. */
  viewBox: string;
  content: string;
  width: number;
  height: number;
}

interface VariantColors {
  mark?: string;
  wordmark: string;
  tagline: string;
  background?: string;
}

function variantColors(
  tokens: BrandTokens,
  variant: LogoVariant,
): VariantColors {
  const { palette, ramp } = tokens;
  switch (variant) {
    case "full":
      return { wordmark: palette.ink, tagline: ramp.subtleInk };
    case "mono-dark":
      return { mark: palette.ink, wordmark: palette.ink, tagline: palette.ink };
    case "mono-light":
      return {
        mark: palette.surface,
        wordmark: palette.surface,
        tagline: palette.surface,
      };
    case "reversed":
      return {
        mark: readableOn(palette.primary),
        wordmark: readableOn(palette.primary),
        tagline: readableOn(palette.primary),
        background: palette.primary,
      };
  }
}

/** Approximate advance width per character, as a fraction of font size. */
const AVG_CHAR_WIDTH = 0.58;
const TAGLINE_CHAR_WIDTH = 0.52;

function textWidth(text: string, fontSize: number, ratio = AVG_CHAR_WIDTH) {
  return text.length * fontSize * ratio;
}

export function composeLogo(
  tokens: BrandTokens,
  options: { variant?: LogoVariant; layout?: LogoLayout } = {},
): ComposedLogo {
  const variant = options.variant ?? "full";
  const layout = options.layout ?? tokens.logoLayout;
  const colors = variantColors(tokens, variant);
  const name = tokens.identity.name.trim() || "Brand";
  const tagline = tokens.identity.tagline?.trim();
  const headingFamily = tokens.fonts.heading.stack;
  const bodyFamily = tokens.fonts.body.stack;

  const mark = generateMark({
    style: tokens.mark.style,
    seed: tokens.mark.seed,
    initials: tokens.mark.initials,
    palette: tokens.palette,
    monoColor: colors.mark,
    fontFamily: headingFamily,
  });

  const parts: string[] = [];
  let width: number;
  let height: number;

  const round = (v: number) => Math.round(v * 100) / 100;

  if (layout === "icon") {
    width = 100;
    height = 100;
    parts.push(`<g>${mark.content}</g>`);
  } else if (layout === "wordmark") {
    const fontSize = 46;
    const pad = 12;
    width = round(textWidth(name, fontSize) + pad * 2);
    height = tagline ? 96 : 72;
    parts.push(
      `<text x="${pad}" y="${tagline ? 44 : 40}" font-family="${headingFamily}" font-size="${fontSize}" font-weight="700" fill="${colors.wordmark}" letter-spacing="${round(fontSize * tokens.fonts.headingTracking)}" dominant-baseline="middle">${escapeXml(name)}</text>`,
    );
    if (tagline) {
      parts.push(
        `<text x="${pad}" y="76" font-family="${bodyFamily}" font-size="17" font-weight="400" fill="${colors.tagline}" letter-spacing="1.4" dominant-baseline="middle">${escapeXml(tagline.toUpperCase())}</text>`,
      );
    }
  } else if (layout === "stacked") {
    const fontSize = 34;
    const markSize = 88;
    const nameWidth = textWidth(name, fontSize);
    const taglineWidth = tagline ? textWidth(tagline, 15, TAGLINE_CHAR_WIDTH) : 0;
    width = round(Math.max(markSize, nameWidth, taglineWidth) + 24);
    height = tagline ? 200 : 172;
    const cx = width / 2;
    parts.push(
      `<g transform="translate(${round(cx - markSize / 2)}, 8) scale(${round(markSize / 100)})">${mark.content}</g>`,
    );
    parts.push(
      `<text x="${round(cx)}" y="${markSize + 40}" font-family="${headingFamily}" font-size="${fontSize}" font-weight="700" fill="${colors.wordmark}" text-anchor="middle" letter-spacing="${round(fontSize * tokens.fonts.headingTracking)}" dominant-baseline="middle">${escapeXml(name)}</text>`,
    );
    if (tagline) {
      parts.push(
        `<text x="${round(cx)}" y="${markSize + 74}" font-family="${bodyFamily}" font-size="15" font-weight="400" fill="${colors.tagline}" text-anchor="middle" letter-spacing="1.6" dominant-baseline="middle">${escapeXml(tagline.toUpperCase())}</text>`,
      );
    }
  } else {
    // horizontal
    const markSize = 88;
    const gap = 20;
    const fontSize = 40;
    const nameWidth = textWidth(name, fontSize);
    const taglineWidth = tagline ? textWidth(tagline, 15, TAGLINE_CHAR_WIDTH) : 0;
    width = round(markSize + gap + Math.max(nameWidth, taglineWidth) + 12);
    height = 104;
    const textX = markSize + gap;
    parts.push(
      `<g transform="translate(0, ${round((height - markSize) / 2)}) scale(${round(markSize / 100)})">${mark.content}</g>`,
    );
    parts.push(
      `<text x="${round(textX)}" y="${tagline ? 44 : 52}" font-family="${headingFamily}" font-size="${fontSize}" font-weight="700" fill="${colors.wordmark}" letter-spacing="${round(fontSize * tokens.fonts.headingTracking)}" dominant-baseline="middle">${escapeXml(name)}</text>`,
    );
    if (tagline) {
      parts.push(
        `<text x="${round(textX)}" y="72" font-family="${bodyFamily}" font-size="15" font-weight="400" fill="${colors.tagline}" letter-spacing="1.5" dominant-baseline="middle">${escapeXml(tagline.toUpperCase())}</text>`,
      );
    }
  }

  const background = colors.background
    ? `<rect x="0" y="0" width="${round(width)}" height="${round(height)}" fill="${colors.background}"/>`
    : "";

  const content = background + parts.join("");
  const viewBox = `0 0 ${round(width)} ${round(height)}`;

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${round(width)}" height="${round(height)}" viewBox="${viewBox}">${content}</svg>`,
    viewBox,
    content,
    width: round(width),
    height: round(height),
  };
}

export const LOGO_VARIANTS: LogoVariant[] = [
  "full",
  "mono-dark",
  "mono-light",
  "reversed",
];

export const LOGO_LAYOUTS: LogoLayout[] = [
  "horizontal",
  "stacked",
  "icon",
  "wordmark",
];
