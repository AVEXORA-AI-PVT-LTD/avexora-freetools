import { type Palette, getPalette, paletteRamp } from "./palettes";
import { type FontPair, getFontPair } from "./fonts";
import { type MarkStyle, initialsFor, seedFrom } from "./marks";

/**
 * `BrandTokens` — the resolved design system for one brand (spec 22 §3.3).
 *
 * A `BrandKit` row stores the *selections* (palette id, font pair id, mark
 * style, seed); `resolveTokens` turns those into the concrete values every
 * layout function reads. Layouts never touch the registries directly, so a
 * palette can gain a colour without touching a single layout.
 */

export interface BrandIdentity {
  /** Trading name — what appears in the logo. */
  name: string;
  /** Registered legal name, if different. Used on statutory blocks. */
  legalName?: string;
  tagline?: string;
}

export interface BrandTokens {
  identity: BrandIdentity;
  palette: Palette;
  ramp: ReturnType<typeof paletteRamp>;
  fonts: FontPair;
  mark: {
    style: MarkStyle;
    seed: number;
    initials: string;
  };
  logoLayout: LogoLayout;
  /** Base type scale in mm, for print layouts. */
  scale: {
    body: number;
    small: number;
    micro: number;
    heading: number;
  };
}

export type LogoLayout = "horizontal" | "stacked" | "icon" | "wordmark";

export interface KitSelection {
  paletteId: string;
  fontPairId: string;
  markStyle: MarkStyle;
  markSeed?: number;
  logoLayout?: LogoLayout;
  tagline?: string;
}

export function resolveTokens(
  identity: BrandIdentity,
  selection: KitSelection,
): BrandTokens {
  const palette = getPalette(selection.paletteId);
  const fonts = getFontPair(selection.fontPairId);
  return {
    identity: {
      ...identity,
      tagline: selection.tagline ?? identity.tagline,
    },
    palette,
    ramp: paletteRamp(palette),
    fonts,
    mark: {
      style: selection.markStyle,
      seed: selection.markSeed ?? seedFrom(identity.name),
      initials: initialsFor(identity.name),
    },
    logoLayout: selection.logoLayout ?? "horizontal",
    // Print type scale in mm. 3.2mm ≈ 9pt body, the floor for legible
    // stationery; the statutory footer uses `micro` and must stay readable.
    scale: {
      heading: 6.4,
      body: 3.2,
      small: 2.7,
      micro: 2.3,
    },
  };
}
