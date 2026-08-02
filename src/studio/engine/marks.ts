import { type Palette, paletteRamp } from "./palettes";

/**
 * Parametric logo marks (spec 22 §3.3).
 *
 * Every mark is *drawn programmatically* from a seed — there is no stock icon
 * library anywhere in this product. Two consequences, both deliberate:
 *
 *  1. No licensing exposure. We are not reselling someone else's icon set, so
 *     a customer's logo cannot be revoked or duplicated from a marketplace.
 *  2. Reproducibility. `(style, seed, initials, palette)` always yields
 *     byte-identical SVG, which is what makes the engine unit-testable and
 *     lets us re-render a brand years later without storing image bytes.
 *
 * All marks are authored in a 100×100 viewBox and scaled by the caller.
 */

export type MarkStyle =
  | "monogram"
  | "geometric"
  | "lettermark"
  | "orbit"
  | "stack"
  | "hexagon"
  | "chevron"
  | "aperture";

export const MARK_STYLES: MarkStyle[] = [
  "monogram",
  "geometric",
  "lettermark",
  "orbit",
  "stack",
  "hexagon",
  "chevron",
  "aperture",
];

export interface Mark {
  viewBox: string;
  content: string;
}

export interface MarkInput {
  style: MarkStyle;
  seed: number;
  /** 1–2 characters. Derived from the brand name by `initialsFor`. */
  initials: string;
  palette: Palette;
  /** Render in a single colour (mono/reversed logo variants). */
  monoColor?: string;
  /** Font family for marks that render a letterform. */
  fontFamily?: string;
}

/** Deterministic PRNG (mulberry32) — same seed, same mark, forever. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length) % items.length];
}

/** Round to 2dp so generated path data is stable across platforms. */
function n(value: number): string {
  return (Math.round(value * 100) / 100).toString();
}

export function initialsFor(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOPWORDS.has(w.toLowerCase()));
  if (words.length === 0) return "A";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Entity suffixes and filler that should never become a monogram letter. */
const STOPWORDS = new Set([
  "pvt",
  "private",
  "ltd",
  "limited",
  "llp",
  "inc",
  "co",
  "company",
  "the",
  "and",
  "of",
  "opc",
]);

function polygonPoints(
  cx: number,
  cy: number,
  r: number,
  sides: number,
  rotation = 0,
): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = rotation + (i * 2 * Math.PI) / sides - Math.PI / 2;
    pts.push(`${n(cx + r * Math.cos(angle))},${n(cy + r * Math.sin(angle))}`);
  }
  return pts.join(" ");
}

/** Arc path from `startDeg` to `endDeg` on a circle — used by orbit/aperture. */
function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startDeg));
  const y1 = cy + r * Math.sin(rad(startDeg));
  const x2 = cx + r * Math.cos(rad(endDeg));
  const y2 = cy + r * Math.sin(rad(endDeg));
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${n(x1)} ${n(y1)} A ${n(r)} ${n(r)} 0 ${large} 1 ${n(x2)} ${n(y2)}`;
}

export function generateMark(spec: MarkInput): Mark {
  const { style, seed, initials, palette, monoColor } = spec;
  const rand = rng(seed);
  const ramp = paletteRamp(palette);

  // In mono variants every shape collapses to one colour; otherwise the mark
  // uses primary + accent so it reads at favicon size.
  const c1 = monoColor ?? palette.primary;
  const c2 = monoColor ?? palette.accent;
  const c3 = monoColor ?? ramp.primaryDeep;
  const onC1 = monoColor ? palette.surface : ramp.onPrimary;
  const font = spec.fontFamily ?? "Inter, system-ui, sans-serif";
  const letters = initials.slice(0, 2).toUpperCase();

  const label = (
    x: number,
    y: number,
    size: number,
    fill: string,
    txt = letters,
  ) =>
    `<text x="${n(x)}" y="${n(y)}" font-family="${font}" font-size="${n(size)}" font-weight="700" fill="${fill}" text-anchor="middle" dominant-baseline="central" letter-spacing="${n(size * -0.02)}">${escapeXml(txt)}</text>`;

  let content = "";

  switch (style) {
    case "monogram": {
      const radius = pick(rand, [8, 14, 22, 50]);
      content =
        `<rect x="4" y="4" width="92" height="92" rx="${n(radius)}" fill="${c1}"/>` +
        label(50, 52, letters.length > 1 ? 40 : 50, onC1);
      break;
    }

    case "lettermark": {
      const barWidth = 6 + Math.floor(rand() * 4);
      content =
        label(50, 46, 62, c1, letters[0]) +
        `<rect x="${n(50 - barWidth * 2.6)}" y="82" width="${n(barWidth * 5.2)}" height="${n(barWidth)}" rx="${n(barWidth / 2)}" fill="${c2}"/>`;
      break;
    }

    case "geometric": {
      const sides = pick(rand, [3, 4, 5, 6]);
      const rot = rand() * Math.PI;
      content =
        `<polygon points="${polygonPoints(50, 50, 44, sides, rot)}" fill="${c1}"/>` +
        `<polygon points="${polygonPoints(50, 50, 22, sides, rot + Math.PI / sides)}" fill="${c2}"/>`;
      break;
    }

    case "orbit": {
      const ringWidth = 7 + Math.floor(rand() * 4);
      const dotAngle = Math.floor(rand() * 360);
      const rad = (dotAngle * Math.PI) / 180;
      content =
        `<circle cx="50" cy="50" r="34" fill="none" stroke="${c1}" stroke-width="${n(ringWidth)}"/>` +
        `<circle cx="${n(50 + 34 * Math.cos(rad))}" cy="${n(50 + 34 * Math.sin(rad))}" r="${n(ringWidth * 1.5)}" fill="${c2}"/>` +
        label(50, 51, 30, c1);
      break;
    }

    case "stack": {
      const bars = 3 + Math.floor(rand() * 2);
      const gap = 6;
      const h = (92 - gap * (bars - 1)) / bars;
      const parts: string[] = [];
      for (let i = 0; i < bars; i++) {
        const inset = i * (4 + Math.floor(rand() * 6));
        parts.push(
          `<rect x="${n(4 + inset)}" y="${n(4 + i * (h + gap))}" width="${n(92 - inset)}" height="${n(h)}" rx="${n(h / 2)}" fill="${i % 2 === 0 ? c1 : c2}"/>`,
        );
      }
      content = parts.join("");
      break;
    }

    case "hexagon": {
      content =
        `<polygon points="${polygonPoints(50, 50, 46, 6, Math.PI / 6)}" fill="${c1}"/>` +
        `<polygon points="${polygonPoints(50, 50, 34, 6, Math.PI / 6)}" fill="none" stroke="${monoColor ? palette.surface : ramp.onPrimary}" stroke-width="2" opacity="0.55"/>` +
        label(50, 52, letters.length > 1 ? 32 : 40, onC1);
      break;
    }

    case "chevron": {
      const thickness = 14 + Math.floor(rand() * 6);
      content =
        `<path d="M 18 30 L 50 58 L 82 30" fill="none" stroke="${c1}" stroke-width="${n(thickness)}" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M 18 62 L 50 90 L 82 62" fill="none" stroke="${c2}" stroke-width="${n(thickness)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`;
      break;
    }

    case "aperture": {
      const blades = 3 + Math.floor(rand() * 3);
      const step = 360 / blades;
      const sweep = step * 0.62;
      const parts: string[] = [];
      for (let i = 0; i < blades; i++) {
        const start = i * step - 90;
        parts.push(
          `<path d="${arcPath(50, 50, 36, start, start + sweep)}" fill="none" stroke="${i % 2 === 0 ? c1 : c2}" stroke-width="12" stroke-linecap="round"/>`,
        );
      }
      content = parts.join("") + `<circle cx="50" cy="50" r="12" fill="${c3}"/>`;
      break;
    }
  }

  return { viewBox: "0 0 100 100", content };
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Wrap mark content into a standalone SVG document. */
export function markToSvg(mark: Mark, size = 256): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${mark.viewBox}">${mark.content}</svg>`;
}

/**
 * A stable seed derived from the brand name, so a brand that regenerates
 * without an explicit seed still gets its own mark rather than everyone
 * sharing seed 0.
 */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
