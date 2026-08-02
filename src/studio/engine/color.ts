/**
 * Colour utilities for the design engine.
 *
 * Palettes are validated against WCAG contrast at build/test time rather than
 * trusted, so a palette that would produce unreadable stationery can never
 * ship (spec 22 §3.3).
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function parseHex(hex: string): Rgb {
  const h = hex.trim().replace(/^#/, "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Invalid hex colour: ${hex}`);
  }
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function toHex({ r, g, b }: Rgb): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** WCAG 2.1 relative luminance. */
export function luminance(color: string): number {
  const { r, g, b } = parseHex(color);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Black or white, whichever is more readable on `background`. Used everywhere
 * text sits on a brand colour, so no generated asset can produce low-contrast
 * text by accident.
 */
export function readableOn(background: string): string {
  return contrastRatio(background, "#ffffff") >=
    contrastRatio(background, "#111111")
    ? "#ffffff"
    : "#111111";
}

export function mix(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  return toHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  });
}

export function lighten(color: string, amount: number): string {
  return mix(color, "#ffffff", amount);
}

export function darken(color: string, amount: number): string {
  return mix(color, "#000000", amount);
}

/** `#rrggbb` at `alpha` — as `#rrggbbaa`, which both SVG and Canvas accept. */
export function withAlpha(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, "0");
  return `${toHex(parseHex(color))}${a}`;
}
