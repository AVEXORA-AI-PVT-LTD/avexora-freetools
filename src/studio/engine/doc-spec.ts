/**
 * `DocSpec` — the single intermediate representation every asset compiles to
 * (spec 22 §3.1).
 *
 * Layout functions produce a DocSpec; the three renderers (SVG, PDF, raster)
 * consume it. No renderer knows what a letterhead or an ID card is, and no
 * layout knows how it will be rasterised. Adding an asset type is a new layout
 * function and nothing else.
 *
 * Print assets are authored in millimetres and converted once, inside the PDF
 * renderer. Screen assets are authored in pixels.
 */

export type Unit = "mm" | "px";

export interface Size {
  w: number;
  h: number;
  unit: Unit;
}

/** A solid colour or a linear gradient between two stops. */
export type Paint =
  | { type: "solid"; color: string; opacity?: number }
  | {
      type: "linear";
      from: string;
      to: string;
      /** Degrees, 0 = left-to-right, increasing clockwise. */
      angle?: number;
    };

export type TextAlign = "left" | "center" | "right";
export type VerticalAlign = "top" | "middle" | "bottom";

export interface TextStyle {
  fontFamily: string;
  /** In the document's unit. */
  fontSize: number;
  fontWeight?: number;
  color: string;
  align?: TextAlign;
  /** Multiplier of fontSize. Defaults to 1.35. */
  lineHeight?: number;
  letterSpacing?: number;
  italic?: boolean;
  /** Wrap to the element's width when set; otherwise render on one line. */
  wrap?: boolean;
  opacity?: number;
  transform?: "uppercase" | "none";
}

interface ElementBase {
  x: number;
  y: number;
  /** Draw order is array order; this is an escape hatch for overlays. */
  opacity?: number;
}

export interface TextElement extends ElementBase {
  kind: "text";
  text: string;
  /** Wrapping width. Required when `style.wrap` is true. */
  w?: number;
  h?: number;
  style: TextStyle;
  verticalAlign?: VerticalAlign;
}

export interface RectElement extends ElementBase {
  kind: "rect";
  w: number;
  h: number;
  fill?: Paint;
  stroke?: { color: string; width: number };
  /** Corner radius in the document's unit. */
  radius?: number;
}

export interface LineElement extends ElementBase {
  kind: "line";
  x2: number;
  y2: number;
  color: string;
  width: number;
  dash?: number[];
}

export interface EllipseElement extends ElementBase {
  kind: "ellipse";
  rx: number;
  ry: number;
  fill?: Paint;
  stroke?: { color: string; width: number };
}

/**
 * A pre-composed SVG fragment (the logo, a generated mark, a QR code) placed
 * into a box. `content` is the inner markup of an SVG with the given viewBox.
 */
export interface SvgElement extends ElementBase {
  kind: "svg";
  w: number;
  h: number;
  viewBox: string;
  content: string;
  /** Preserve aspect ratio inside the box. Defaults to true. */
  fit?: boolean;
}

/** A raster image, supplied as a data URI. */
export interface ImageElement extends ElementBase {
  kind: "image";
  w: number;
  h: number;
  /** data: URI. Remote URLs are deliberately not supported. */
  href: string;
  radius?: number;
}

export type Element =
  | TextElement
  | RectElement
  | LineElement
  | EllipseElement
  | SvgElement
  | ImageElement;

export interface DocSpec {
  size: Size;
  /** Print bleed on every edge, in the document's unit. Print assets only. */
  bleed?: number;
  /** Draw crop marks outside the trim box. Requires `bleed`. */
  cropMarks?: boolean;
  background?: Paint;
  elements: Element[];
  /** Fonts the renderer must embed, by family name. */
  fonts?: string[];
  meta?: {
    title?: string;
    /** Shown to the user; also used as the download filename stem. */
    filename?: string;
  };
}

// --- unit helpers -----------------------------------------------------------

export const MM_TO_PT = 72 / 25.4;

export function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

/** Millimetres to CSS pixels at a given DPI (96 = 1× screen). */
export function mmToPx(mm: number, dpi = 96): number {
  return (mm / 25.4) * dpi;
}

/**
 * Total page size including bleed on all four edges. Renderers draw the page
 * at this size and place the trim box inset by `bleed`.
 */
export function bleedBox(spec: DocSpec): Size {
  const b = spec.bleed ?? 0;
  return {
    w: spec.size.w + b * 2,
    h: spec.size.h + b * 2,
    unit: spec.size.unit,
  };
}

// --- construction helpers ---------------------------------------------------

export function solid(color: string, opacity?: number): Paint {
  return { type: "solid", color, opacity };
}

export function text(el: Omit<TextElement, "kind">): TextElement {
  return { kind: "text", ...el };
}

export function rect(el: Omit<RectElement, "kind">): RectElement {
  return { kind: "rect", ...el };
}

export function line(el: Omit<LineElement, "kind">): LineElement {
  return { kind: "line", ...el };
}

export function ellipse(el: Omit<EllipseElement, "kind">): EllipseElement {
  return { kind: "ellipse", ...el };
}

export function svg(el: Omit<SvgElement, "kind">): SvgElement {
  return { kind: "svg", ...el };
}

export function image(el: Omit<ImageElement, "kind">): ImageElement {
  return { kind: "image", ...el };
}
