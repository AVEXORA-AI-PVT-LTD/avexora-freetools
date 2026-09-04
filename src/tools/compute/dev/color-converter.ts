import type { GenerateFn } from "@/types/tools";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function parseColor(input: string): Rgb | null {
  const s = input.trim().toLowerCase();

  const hex = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  const rgb = s.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgb) {
    const [r, g, b] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
    if (r > 255 || g > 255 || b > 255) return null;
    return { r, g, b };
  }

  const hsl = s.match(/^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%/);
  if (hsl) {
    const h = Number(hsl[1]);
    const sl = Number(hsl[2]) / 100;
    const l = Number(hsl[3]) / 100;
    if (h > 360 || sl > 1 || l > 1) return null;
    const c = (1 - Math.abs(2 * l - 1)) * sl;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    const [r1, g1, b1] =
      h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] :
      h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255),
    };
  }

  return null;
}

function toHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h =
    max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) :
    max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  h *= 60;
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export const convertColor: GenerateFn = (values) => {
  const input = typeof values.color === "string" ? values.color : "";
  if (input.trim() === "") return { error: "Enter a colour to convert." };

  const rgb = parseColor(input);
  if (!rgb) {
    return {
      error:
        "Couldn't parse that colour. Use hex (#1a2b3c or #abc), rgb(26, 43, 60) or hsl(210, 40%, 17%).",
    };
  }

  const hex = `#${[rgb.r, rgb.g, rgb.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  const { h, s, l } = toHsl(rgb);

  return {
    text: [
      `HEX:  ${hex}`,
      `RGB:  rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      `HSL:  hsl(${h}, ${s}%, ${l}%)`,
    ].join("\n"),
  };
};
