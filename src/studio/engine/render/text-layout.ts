import type { TextStyle } from "../doc-spec";

/**
 * Text measurement and wrapping shared by all three renderers.
 *
 * The SVG and Canvas renderers could measure text natively, but the PDF
 * renderer must wrap identically or a letterhead would paginate differently on
 * screen and in print. So all three use this one estimator, and the PDF
 * renderer refines it with real font metrics where it can.
 */

/**
 * Average advance width as a fraction of font size, by rough character class.
 * Calibrated against Inter and IBM Plex Sans; good to a few percent, which is
 * enough for layout boxes that carry deliberate slack.
 */
const NARROW = new Set("iljtfIJ.,;:'\"!|()[]{}`-".split(""));
const WIDE = new Set("mwMW@%".split(""));

export function estimateTextWidth(
  text: string,
  fontSize: number,
  opts: { bold?: boolean; letterSpacing?: number } = {},
): number {
  let units = 0;
  for (const ch of text) {
    if (NARROW.has(ch)) units += 0.32;
    else if (WIDE.has(ch)) units += 0.9;
    else if (ch === " ") units += 0.27;
    else if (ch >= "A" && ch <= "Z") units += 0.66;
    else if (ch >= "0" && ch <= "9") units += 0.58;
    else units += 0.53;
  }
  const bold = opts.bold ? 1.03 : 1;
  return units * fontSize * bold + (opts.letterSpacing ?? 0) * text.length;
}

export function lineHeightFor(style: TextStyle): number {
  return style.fontSize * (style.lineHeight ?? 1.35);
}

export function applyTransform(text: string, style: TextStyle): string {
  return style.transform === "uppercase" ? text.toUpperCase() : text;
}

/**
 * Greedy word wrap to `maxWidth`. Explicit newlines are honoured as hard
 * breaks — addresses are entered as multi-line text and must stay that way.
 * A single word longer than the line is broken by character rather than
 * allowed to overflow the page.
 */
export function wrapText(
  text: string,
  style: TextStyle,
  maxWidth: number,
): string[] {
  const bold = (style.fontWeight ?? 400) >= 600;
  const measure = (s: string) =>
    estimateTextWidth(s, style.fontSize, {
      bold,
      letterSpacing: style.letterSpacing,
    });

  const out: string[] = [];

  for (const hardLine of applyTransform(text, style).split("\n")) {
    if (hardLine.trim() === "") {
      out.push("");
      continue;
    }
    let current = "";
    for (const word of hardLine.split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word;
      if (measure(candidate) <= maxWidth || current === "") {
        // A lone word wider than the box still has to go somewhere; break it.
        if (current === "" && measure(word) > maxWidth) {
          let chunk = "";
          for (const ch of word) {
            if (measure(chunk + ch) > maxWidth && chunk !== "") {
              out.push(chunk);
              chunk = ch;
            } else {
              chunk += ch;
            }
          }
          current = chunk;
        } else {
          current = candidate;
        }
      } else {
        out.push(current);
        current = word;
      }
    }
    if (current) out.push(current);
  }

  return out.length > 0 ? out : [""];
}

/** Lines a text element will occupy, for callers that need to reserve space. */
export function measureBlock(
  text: string,
  style: TextStyle,
  maxWidth?: number,
): { lines: string[]; width: number; height: number } {
  const lines =
    style.wrap && maxWidth
      ? wrapText(text, style, maxWidth)
      : applyTransform(text, style).split("\n");
  const bold = (style.fontWeight ?? 400) >= 600;
  const width = Math.max(
    ...lines.map((l) =>
      estimateTextWidth(l, style.fontSize, {
        bold,
        letterSpacing: style.letterSpacing,
      }),
    ),
  );
  return { lines, width, height: lines.length * lineHeightFor(style) };
}
