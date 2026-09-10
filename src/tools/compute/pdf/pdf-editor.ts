import { PDFString } from "pdf-lib";
/**
 * Compute helpers for the PDF Editor tool.
 *
 * The editor works on two coordinate systems:
 *  - PDF user space (points, origin bottom-left, y grows upward) — the space
 *    pdf-lib draws into and the space every element is stored in.
 *  - viewport/display space (CSS pixels, origin top-left) — the space the
 *    pdf.js canvas is rendered into; mapped to/from user space by the page
 *    viewport transform so edits stay aligned at any zoom and rotation.
 *
 * Editing real, already-existing text is honest about its limits: pdf-lib
 * cannot rewrite the content stream of an existing PDF page, so replacing an
 * existing piece of text is implemented as a coordinate-accurate background
 * rect drawn exactly over the original text plus a redraw of the new text on
 * top. The redraw tries very hard to reuse the *original* typography — the
 * originally embedded font program (TrueType/Type0 FontFile2/3) or the exact
 * standard-14 base font — and only falls back to an embedded/open font when
 * the original program cannot be re-embedded (subset that fontkit cannot
 * parse, Type1/CFF outlines, missing glyph coverage, or no font file at all).
 */
export { PdfSignatureError, inspectPdf } from "./pdf-signature";

export const PDF_EDITOR_MAX_BYTES = 50 * 1024 * 1024;
export const PDF_EDITOR_MAX_PAGES = 200;
export const PDF_EDITOR_MIN_FONT_SIZE = 6;
export const PDF_EDITOR_MAX_FONT_SIZE = 120;
export const PDF_EDITOR_MIN_ELEMENT_SIZE = 0.5;

export class PdfEditorError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "PdfEditorError";
    this.code = code;
  }
}

export type PdfEditorElementKind =
  | "text"
  | "heading"
  | "tagline"
  | "paragraph"
  | "textbox";

export type PdfEditorAlign = "left" | "center" | "right";
/**
 * `original` is a special id used only by extracted elements: it means "reuse
 * the typography detected from the PDF itself" (original embedded font program
 * or exact standard-14 base font), falling back to the closest metric-compatible
 * family when the program cannot be re-embedded.
 */
export type PdfEditorFontId = "sans" | "serif" | "mono" | "handwriting" | "original";
export type PdfEditorWeight = "normal" | "bold";

export interface PdfEditorElement {
  readonly id: string;
  /** 1-based page number this element lives on. */
  readonly pageNumber: number;
  readonly kind: PdfEditorElementKind;
  /** extracted → a real piece of existing text being replaced; new → freshly added. */
  readonly source: "extracted" | "new";
  text: string;
  /** Top-left corner of the element box in PDF user-space points. */
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  font: PdfEditorFontId;
  /**
   * Family used by the on-canvas preview and as the export fallback when an
   * `font === "original"` element's original program cannot be re-embedded.
   * Derived from the Adobe font name at extraction time (sans/serif/mono).
   */
  fallbackFont: PdfEditorFontId;
  weight: PdfEditorWeight;
  italic: boolean;
  /** Hex color like "#111827". */
  color: string;
  align: PdfEditorAlign;
  /** Line spacing as a multiple of the font size. */
  lineHeight: number;
  /** 0–1 opacity (default 1). */
  opacity?: number;
  /** Underline decoration (export draws a line below the baseline). */
  underline?: boolean;
  /** Rotation in degrees around the element centre (new text only; extracted = 0). */
  rotation?: number;
  /** Optional URL link annotation attached to the element. */
  link?: string;
  /** extracted elements can be deleted-in-place: the area is covered and nothing redrawn. */
  removed: boolean;
  /**
   * For extracted elements, the original area covered when a replacement was
   * first applied. When an extracted element is moved after being rewritten,
   * both this area (the original text) and the current position are covered so
   * no duplicate of the old text survives. `null` while the element is pristine.
   */
  coverRect?: { x: number; y: number; width: number; height: number } | null;
  /** Set once any property of an extracted element is changed (so download only rewrites touched text). */
  touched?: boolean;
  /** Raw pdf.js font name / PostScript name detected at extraction (e.g. "g_d0_f2" or "Helvetica"). */
  sourceFontName?: string;
  /** Human-readible original font family, best effort ("" when pdf.js could not derive one). */
  sourceFontLabel?: string;
  /** Typography detected from the original at extraction time. */
  detectedFontSize?: number;
  detectedColor?: string;
  detectedWeight?: PdfEditorWeight;
  detectedItalic?: boolean;
}

export interface EditorPageMeta {
  /** Page size in PDF user-space points (unrotated). */
  width: number;
  height: number;
}

export const PDF_EDITOR_DEFAULT_SIZES: Record<PdfEditorElementKind, number> = {
  text: 12,
  heading: 24,
  tagline: 15,
  paragraph: 12,
  textbox: 13,
};

export const PDF_EDITOR_LINE_HEIGHTS: Record<PdfEditorElementKind, number> = {
  text: 1.25,
  heading: 1.15,
  tagline: 1.3,
  paragraph: 1.5,
  textbox: 1.45,
};

/** Average glyph advance for width/wrap estimation, per font family. */
export const PDF_EDITOR_ADVANCE_EM: Record<PdfEditorFontId, number> = {
  sans: 0.52,
  serif: 0.5,
  mono: 0.6,
  handwriting: 0.5,
  original: 0.5,
};

export const PDF_EDITOR_FONT_LABELS: Record<PdfEditorFontId, string> = {
  sans: "Sans",
  serif: "Serif",
  mono: "Monospace",
  handwriting: "Handwriting",
  original: "Original font (PDF)",
};

export const PDF_EDITOR_COLORS = [
  "#111827",
  "#4b5563",
  "#b91c1c",
  "#b45309",
  "#1d4ed8",
  "#0f766e",
  "#15803d",
  "#7c3aed",
] as const;

export function createElementId(): string {
  return `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim()) ?? /^#([0-9a-f]{3})$/i.exec(hex.trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  if (m[1].length === 3) {
    const r = parseInt(m[1][0] + m[1][0], 16);
    const g = parseInt(m[1][1] + m[1][1], 16);
    const b = parseInt(m[1][2] + m[1][2], 16);
    return { r, g, b };
  }
  return {
    r: parseInt(m[1].slice(0, 2), 16),
    g: parseInt(m[1].slice(2, 4), 16),
    b: parseInt(m[1].slice(4, 6), 16),
  };
}

export function makeElement(
  kind: PdfEditorElementKind,
  pageNumber: number,
  page: { width: number; height: number },
  opts: Partial<Pick<PdfEditorElement, "x" | "y" | "width" | "height">> = {},
): PdfEditorElement {
  const fontSize = PDF_EDITOR_DEFAULT_SIZES[kind];
  const text =
    kind === "heading"
      ? "Your heading"
      : kind === "tagline"
        ? "Your tagline"
        : kind === "paragraph"
          ? "Type your paragraph text here."
          : kind === "textbox"
            ? "Text box — click to edit."
            : "Your text";
  const width =
    opts.width ?? (kind === "paragraph" || kind === "textbox" ? 200 : 160);
  const height =
    opts.height ??
    Math.max(1.5 * fontSize, Math.min(page.height / 3, fontSize * 2));
  const x =
    opts.x ?? clamp((page.width - width) / 2, 0, Math.max(0, page.width - width));
  const y =
    opts.y ??
    clamp((page.height - height) / 2 + height, height, page.height);
  return {
    id: createElementId(),
    pageNumber,
    kind,
    source: "new",
    text,
    x,
    y,
    width,
    height,
    fontSize,
    font: "sans",
    fallbackFont: "sans",
    weight: kind === "heading" ? "bold" : "normal",
    italic: false,
    color: "#111827",
    align: "left",
    lineHeight: PDF_EDITOR_LINE_HEIGHTS[kind],
    removed: false,
    coverRect: null,
    opacity: 1,
    underline: false,
    rotation: 0,
    link: "",
  };
}

/**
 * A text item as returned by pdf.js `page.getTextContent()`.
 * `transform` maps text space to PDF user space; `width`/`height` are already
 * expressed in user-space points (the width is the advance of the glyph run,
 * the height the font size).
 */
export interface PdfSourceTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName?: string;
  /** pdf.js does not expose fontSize directly; the UI may optionally compute it. */
  fontSize?: number;
}

/**
 * Convert a pdf.js text item into an axis-aligned bounding box in PDF
 * user-space points. The baseline start is `(e, f)`; the run extends `width`
 * points along the (normalized) advance direction `(a, b)` and the ascender
 * extends `height` points along `(c, d)`. This stays correct on rotated
 * pages; the returned box is the tight axis-aligned box around the four
 * corners of the glyph run.
 */
export function textItemBBox(item: PdfSourceTextItem): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const [a, b, c, d, e, f] = item.transform;
  const lenD = Math.hypot(a, b) || 1;
  const lenU = Math.hypot(c, d) || 1;
  const runX = (a / lenD) * item.width;
  const runY = (b / lenD) * item.width;
  const upX = (c / lenU) * item.height;
  const upY = (d / lenU) * item.height;
  const xs = [e, e + runX, e + upX, e + runX + upX];
  const ys = [f, f + runY, f + upY, f + runY + upY];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: maxY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
}

function deriveFont(
  fontName: string | undefined,
  family?: string | null,
): Pick<PdfEditorElement, "fallbackFont" | "weight" | "italic" | "sourceFontLabel"> {
  const raw = fontName ?? "";
  const face = raw
    .replace(/^g\d+_f\d+_?/i, "")
    .replace(/[-\d]+/g, " ")
    .toLowerCase()
    .trim();
  const familyFace = (family ?? "").toLowerCase().trim();
  const weight: PdfEditorWeight =
    /\b(bold|black|medium|semibold|demi|heavy)\b/.test(face) ||
    /\b(bolditalic|bold-italic)\b/.test(face) ||
    face.includes("bold")
      ? "bold"
      : "normal";
  const italic =
    face.includes("italic") ||
    /\b(oblique|inclined|slant|cursive)\b/.test(face);
  const isSerif =
    /\b(times|georgia|garamond|palatino|cambria|bookman|georgia|symbol)\b/.test(face) ||
    /\bserif\b/.test(face) ||
    /\bliberation\b/.test(face) && /\bserif\b/.test(familyFace);
  const isMono =
    /\b(courier|couri|consol|menlo|monaco|lettergothic)\b/.test(face) ||
    /\bmono(space)?\b/.test(face) ||
    /\bliberation\b/.test(face) && /\bmono\b/.test(familyFace);
  const label = family && family !== "sans-serif" ? family : lookReadableLabel(raw);
  return {
    fallbackFont: isMono ? "mono" : isSerif ? "serif" : "sans",
    weight,
    italic,
    sourceFontLabel: label,
  };
}

/** Keep a readable original family name when pdf.js hands us one; "" otherwise. */
function lookReadableLabel(fontName: string): string {
  const m = /^g\d+_f\d+_?(.+)?$/i.exec(fontName);
  if (!m) return fontName.trim();
  return "";
}

/**
 * A text item as returned by pdf.js `page.getTextContent()`.
 * `transform` maps text space to PDF user space; `width`/`height` are already
 * expressed in user-space points (the width is the advance of the glyph run,
 * the height the font size).
 */
export interface PdfSourceTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName?: string;
  fontSize?: number;
}

/** A pdf.js `TextStyle` (from `TextContent.styles`, keyed by font name). */
export interface PdfSourceTextStyle {
  fontFamily?: string;
  ascent?: number;
  descent?: number;
  vertical?: boolean;
}

const DETECTED_FALLBACK_COLOR = "#111827";

/**
 * Build an editable element from a pdf.js text item (baseline top at item top).
 * The extracted element carries the typography *detected from the PDF itself*:
 * `fontSize` from the user-space glyph height, `color` from the fill colour
 * tracked through the page operator list (opts.color), weight/italic/family
 * class from the Adobe font name. `font` is set to `"original"` so the export
 * reuses the PDF's own font program; `fallbackFont` holds the heuristic family
 * used for the preview and when the original cannot be re-embedded.
 */
export function elementFromTextItem(
  id: string,
  pageNumber: number,
  item: PdfSourceTextItem,
  opts: { style?: PdfSourceTextStyle | null; color?: string } = {},
): PdfEditorElement {
  const box = textItemBBox(item);
  const style = deriveFont(item.fontName, opts.style?.fontFamily);
  const detectedSize = Math.hypot(item.transform?.[0] ?? 0, item.transform?.[1] ?? 0)
    || item.height || box.height;
  const fontSize = clamp(
    Math.round(detectedSize),
    PDF_EDITOR_MIN_FONT_SIZE,
    PDF_EDITOR_MAX_FONT_SIZE,
  );
  const color = opts.color?.match(/^#[0-9a-fA-F]{6}$/) ? opts.color : DETECTED_FALLBACK_COLOR;
  return {
    id,
    pageNumber,
    kind: item.height > 22 ? "heading" : "text",
    source: "extracted",
    text: item.str.trim(),
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    fontSize,
    font: "original",
    fallbackFont: style.fallbackFont,
    weight: style.weight,
    italic: style.italic,
    color,
    align: "left",
    lineHeight: PDF_EDITOR_LINE_HEIGHTS.text,
    removed: false,
    coverRect: null,
    sourceFontName: item.fontName,
    sourceFontLabel: style.sourceFontLabel,
    detectedFontSize: fontSize,
    detectedColor: color,
    detectedWeight: style.weight,
    detectedItalic: style.italic,
  };
}

/* ---------------------------------------------------------------------------
 * Text colour detection from the page operator list.
 *
 * pdf.js does not expose the original text colour through getTextContent(), so
 * it is recovered from page.getOperatorList(): the running fill colour is
 * tracked through the painter's operator stream and captured at every
 * show-text operator. Modern pdf.js encodes RGB fills as "#rrggbb" strings, so
 * the common path is trivial; gray/CMYK/generic colour operators are handled
 * too. The captured glyph strings are then aligned back to the TextItems by a
 * normalised character-consumption walk, so an item whose run got split across
 * several show operators still receives the colour that was active when its
 * text was painted.
 * ------------------------------------------------------------------------- */

export interface PdfEditorOpCodes {
  showText: number;
  showSpacedText: number;
  nextLineShowText: number;
  nextLineSetSpacingShowText: number;
  setFillRGBColor: number;
  setFillGray: number;
  setFillCMYKColor: number;
  setFillColor: number;
  setFillColorSpace: number;
}

export interface PdfColorRun {
  text: string;
  color: string | null;
}

function glyphTextOf(args: unknown[]): string {
  let s = "";
  for (const a of args) {
    if (Array.isArray(a)) {
      for (const g of a) {
        if (typeof g === "string") s += g;
        else if (g && typeof g === "object" && typeof (g as { unicode?: unknown }).unicode === "string") {
          s += (g as { unicode: string }).unicode;
        }
      }
    } else if (typeof a === "string") {
      s += a;
    } else if (a && typeof a === "object" && typeof (a as { unicode?: unknown }).unicode === "string") {
      s += (a as { unicode: string }).unicode;
    }
  }
  return s;
}

function hexFromFill(args: unknown[], space: string): string | null {
  if (args.length === 0) return null;
  const first = args[0];
  if (typeof first === "string" && /^#[0-9a-fA-F]{6}$/.test(first)) return first.toLowerCase();
  if (typeof first === "number") {
    if (space === "DeviceCMYK" && args.length >= 4) {
      const nums = args.slice(0, 4).map(Number);
      const r = Math.round((1 - Math.min(1, nums[0])) * 255);
      const g = Math.round((1 - Math.min(1, nums[1])) * 255);
      const b = Math.round((1 - Math.min(1, nums[2])) * 255);
      return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    }
    const v = clamp(Math.round(Number(first) * 255), 0, 255);
    const hex = v.toString(16).padStart(2, "0");
    return `#${hex}${hex}${hex}`;
  }
  return null;
}

/**
 * Walk an operator list and record one entry per show-text operator: the UTF
 * text it paints (glyph `unicode` / legacy strings) and the fill colour active
 * at that moment (null when unknown). Pure and pdf.js-version-independent — the
 * caller passes the op-code numbers from its own `pdf.js` `OPS` enum.
 */
export function extractColorRuns(
  fnArray: number[],
  argsArray: unknown[][],
  opCodes: PdfEditorOpCodes,
): PdfColorRun[] {
  const show = new Set<number>([
    opCodes.showText,
    opCodes.showSpacedText,
    opCodes.nextLineShowText,
    opCodes.nextLineSetSpacingShowText,
  ]);
  let fill: string | null = null;
  let space = "DeviceRGB";
  const runs: PdfColorRun[] = [];
  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i];
    const args = argsArray[i];
    if (!args || args.length === 0) continue;
    if (fn === opCodes.setFillColorSpace) {
      const cs = args[0];
      if (cs && typeof cs === "object" && typeof (cs as { name?: unknown }).name === "string") {
        space = (cs as { name: string }).name;
      } else if (typeof cs === "string") {
        space = cs;
      }
      continue;
    }
    if (fn === opCodes.setFillRGBColor) {
      const c = hexFromFill(args, "DeviceRGB");
      if (c) fill = c;
      continue;
    }
    if (fn === opCodes.setFillGray) {
      const c = hexFromFill(args, "DeviceGray");
      if (c) fill = c;
      continue;
    }
    if (fn === opCodes.setFillCMYKColor) {
      const c = hexFromFill(args, "DeviceCMYK");
      if (c) fill = c;
      continue;
    }
    if (fn === opCodes.setFillColor) {
      const c = hexFromFill(args, space);
      if (c) fill = c;
      continue;
    }
    if (show.has(fn)) {
      runs.push({ text: glyphTextOf(args), color: fill });
    }
  }
  return runs;
}

const normText = (s: string): string => s.normalize("NFKC").replace(/\s+/g, " ").trim();

/**
 * Align colour runs back to the original `TextContent.items` (in document
 * order) using a character-consumption walk. Returns one colour per item
 * (`null` when undetectable). The item list must be the raw `content.items`
 * array so indexes line up with the caller's own filtering.
 */
export function colorsForItems(runs: PdfColorRun[], items: PdfSourceTextItem[]): (string | null)[] {
  const out: (string | null)[] = new Array(items.length).fill(null);
  let runIdx = 0;
  let pending = "";
  let pendingColor: string | null = null;
  const wants = items.map((i) => normText(i.str));
  for (let i = 0; i < items.length; i++) {
    const target = wants[i];
    if (!target) continue;
    while (runIdx < runs.length && !pending.includes(target)) {
      pending += normText(runs[runIdx].text);
      if (runs[runIdx].color) pendingColor = runs[runIdx].color;
      runIdx++;
    }
    if (!pending.includes(target)) continue;
    out[i] = pendingColor;
    pending = pending.slice(pending.indexOf(target) + target.length);
  }
  return out;
}

/**
 * Greedy word-wrap that breaks a string into lines whose estimated width fits
 * `maxWidthPt` for the given font. Explicit `\n` are respected. Both the export
 * builder and the on-canvas preview use this same function so the file always
 * matches what is shown on screen. The estimate uses each font family's average
 * glyph advance, which is close but not pixel-perfect for every glyph.
 */
export function wrapText(
  text: string,
  maxWidthPt: number,
  fontSize: number,
  font: PdfEditorFontId,
): string[] {
  const clean = text.replace(/\r/g, "");
  if (clean.trim() === "") return [""];
  const adv = Math.max(2, PDF_EDITOR_ADVANCE_EM[font] * fontSize);
  const maxChars = Math.max(3, Math.floor(maxWidthPt / adv));
  const out: string[] = [];
  for (const para of clean.split("\n")) {
    const words = para.split(" ");
    let line = "";
    for (const word of words) {
      const maybe = line === "" ? word : `${line} ${word}`;
      if (line === "" && word.length > maxChars) {
        for (let i = 0; i < word.length; i += maxChars) {
          out.push(word.slice(i, i + maxChars));
        }
        line = "";
        continue;
      }
      if (maybe.length <= maxChars) {
        line = maybe;
      } else {
        if (line !== "") out.push(line);
        line = word;
      }
    }
    if (line !== "") out.push(line);
  }
  return out.length > 0 ? out : [clean];
}

export function sanitizeEditedFilename(name: string): string {
  const base = (name.replace(/\.pdf$/i, "") || "document")
    .replace(/[\\/]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `edited-${base || "document"}.pdf`;
}

type Loader = (url: string) => Promise<Uint8Array>;

async function defaultLoader(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed for ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

type AnyFont = import("pdf-lib").PDFFont;
type PdfLibPage = import("pdf-lib").PDFPage;

async function getPdfLib() {
  const [{ PDFDocument, PDFName, PDFDict, PDFRef, PDFArray, PDFStream, rgb }, { default: fontkit }] =
    await Promise.all([
      import("pdf-lib"),
      import("@pdf-lib/fontkit"),
    ]);
  return { PDFDocument, PDFName, PDFDict, PDFRef, PDFArray, PDFStream, rgb, fontkit };
}

/** TrueType programs embedding is the path fontkit can subset; CFF/Type1 cannot. */
const STANDARD_BASE_FONTS = [
  "Times-Roman",
  "Times-Bold",
  "Times-Italic",
  "Times-BoldItalic",
  "Helvetica",
  "Helvetica-Bold",
  "Helvetica-Oblique",
  "Helvetica-BoldOblique",
  "Courier",
  "Courier-Bold",
  "Courier-Oblique",
  "Courier-BoldOblique",
  "Symbol",
  "ZapfDingbats",
];

type PdfLibNs = Awaited<ReturnType<typeof getPdfLib>>;

function inflateStream(raw: Uint8Array<ArrayBufferLike>): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    try {
      const ds = new DecompressionStream("deflate");
      ds.writable.getWriter().write(raw as unknown as BufferSource).catch(() => undefined);
      void writerWritten(ds, raw)
        .then(() => new Response(ds.readable).arrayBuffer())
        .then((buf) => resolve(new Uint8Array(buf)))
        .catch(() => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

async function writerWritten(
  ds: DecompressionStream,
  raw: Uint8Array<ArrayBufferLike>,
): Promise<void> {
  const writer = ds.writable.getWriter();
  await writer.write(raw as unknown as BufferSource);
  await writer.close();
  writer.releaseLock();
}

/**
 * Find the PDF font resource that produced a given extracted text element.
 * pdf.js internal font names (`g_d0_f2`) index the page's /Font resources in
 * the order fontkit consults them, so the ordinal is tried first; a
 * PostScript-name match and a sole-embedded-font fallback cover the rest.
 * Returns the resource's BaseFont, subtype, and its embedded font program
 * (FlateDecode decompressed when needed).
 */
async function sourceFontResource(
  lib: PdfLibNs,
  ctx: import("pdf-lib").PDFContext,
  pageNode: import("pdf-lib").PDFPageLeaf,
  el: PdfEditorElement,
): Promise<{ base: string; subtype: string; program: Uint8Array | null; isStandard: boolean } | null> {
  const { PDFName, PDFDict, PDFRef, PDFArray, PDFStream } = lib;
  const resources = pageNode.Resources();
  if (!resources) return null;
  const fonts = resources.lookupMaybe(PDFName.of("Font"), PDFDict);
  if (!fonts) return null;
  const entries = [...fonts.entries()];
  if (entries.length === 0) return null;

  const resolve = (v: unknown): unknown => (v instanceof PDFRef ? ctx.lookup(v) : v);

  const baseNameOf = (value: unknown): string => {
    const resolved = resolve(value);
    if (resolved instanceof PDFDict) return resolved.lookupMaybe(PDFName.of("BaseFont"), PDFName)?.decodeText() ?? "";
    return "";
  };

  const ordinal = /^g\d+_f(\d+)$/i.exec(el.sourceFontName ?? "");
  let pick = typeof ordinal?.[1] === "string" ? Number(ordinal[1]) - 1 : -1;
  if (pick < 0 || pick >= entries.length) {
    const label = (el.sourceFontLabel ?? "").toLowerCase().trim();
    pick = -1;
    for (let i = 0; i < entries.length; i++) {
      const b = baseNameOf(entries[i][1]).toLowerCase();
      if (label && b && (b.includes(label) || label.includes(b))) {
        pick = i;
        break;
      }
    }
  }
  if (pick < 0 && entries.length === 1) pick = 0;
  if (pick < 0) return null;

  const fontDict = resolve(entries[pick][1]);
  if (!(fontDict instanceof PDFDict)) return null;

  const subtype = fontDict.lookupMaybe(PDFName.of("Subtype"), PDFName)?.decodeText() ?? "";
  let fd = fontDict.lookupMaybe(PDFName.of("FontDescriptor"), PDFDict);
  if (subtype === "Type0" && !fd) {
    const descendants = fontDict.lookupMaybe(PDFName.of("DescendantFonts"), PDFArray);
    if (descendants && descendants.size() > 0) {
      const cid = resolve(descendants.get(0));
      if (cid instanceof PDFDict) fd = cid.lookupMaybe(PDFName.of("FontDescriptor"), PDFDict);
    }
  }

  let program: Uint8Array | null = null;
  let filterIsFlate = false;
  if (fd) {
    const ff2 = fd.lookupMaybe(PDFName.of("FontFile2"), PDFStream);
    const ff3 = fd.lookupMaybe(PDFName.of("FontFile3"), PDFStream);
    const stream = ff2 ?? ff3;
    if (stream) {
      const filter = stream.dict.get(PDFName.of("Filter"));
      filterIsFlate = !!filter && filter.toString().toLowerCase().includes("flatedecode");
      const raw = stream.getContents();
      program = filterIsFlate ? await inflateStream(raw) : raw;
    }
  }

  const base = entries[pick] ? baseNameOf(entries[pick][1]) : "";
  const isStandard =
    !program &&
    (subtype === "Type1" || subtype === "MMType1" || subtype === "TrueType") &&
    STANDARD_BASE_FONTS.includes(stripSubsetPrefix(base));

  return { base, subtype, program, isStandard };
}

/**
 * Read every font resource on a given page, returning the pdfjs ordinal (1-based)
 * alongside the BaseFont name and whether it is a standard-14 font.
 * Used by the UI to show real font names in the inspector.
 */
export async function readPageFonts(
  bytes: Uint8Array,
  pageNumber: number,
): Promise<{ ordinal: number; base: string; isStandard: boolean }[]> {
  const lib = await getPdfLib();
  const { PDFDocument, PDFName, PDFDict, PDFRef } = lib;
  const doc = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
  if (pageNumber < 1 || pageNumber > doc.getPageCount()) return [];
  const page = doc.getPage(pageNumber - 1);
  const resources = page.node.Resources();
  if (!resources) return [];
  const fonts = resources.lookupMaybe(PDFName.of("Font"), PDFDict);
  if (!fonts) return [];
  const entries = [...fonts.entries()];
  const resolve = (v: unknown): unknown => (v instanceof PDFRef ? doc.context.lookup(v) : v);
  const result: { ordinal: number; base: string; isStandard: boolean }[] = [];
  for (let i = 0; i < entries.length; i++) {
    const resolved = resolve(entries[i][1]);
    if (!(resolved instanceof PDFDict)) continue;
    const base = resolved.lookupMaybe(PDFName.of("BaseFont"), PDFName)?.decodeText() ?? "";
    const subtype = resolved.lookupMaybe(PDFName.of("Subtype"), PDFName)?.decodeText() ?? "";
    const isStd =
      (subtype === "Type1" || subtype === "MMType1" || subtype === "TrueType") &&
      STANDARD_BASE_FONTS.includes(stripSubsetPrefix(base));
    result.push({ ordinal: i + 1, base, isStandard: isStd });
  }
  return result;
}

function stripSubsetPrefix(name: string): string {
  return name.replace(/^[A-Z]{6}\+/, "").trim();
}

/** Map a standard-14 BaseFont + user weight/italic to the exact pdf-lib name. */
function standardVariant(base: string, weight: PdfEditorWeight, italic: boolean): string {
  const plain = stripSubsetPrefix(base);
  const token = plain.replace(/-.*$/, "");
  if (token === "Symbol" || token === "ZapfDingbats") return plain;
  const bold = weight === "bold";
  if (token === "Times") {
    if (!bold && !italic) return "Times-Roman";
    return `Times-${bold ? "Bold" : ""}${italic ? "Italic" : ""}`;
  }
  if (token === "Courier") {
    if (!bold && !italic) return "Courier";
    return `Courier-${bold ? "Bold" : ""}${italic ? "Oblique" : ""}`;
  }
  if (!bold && !italic) return "Helvetica";
  return `Helvetica-${bold ? "Bold" : ""}${italic ? "Oblique" : ""}`;
}

/** Detect an AcroForm digital-signature field (best effort, non-destructive). */
export async function isPdfSigned(bytes: Uint8Array): Promise<boolean> {
  try {
    const lib = await getPdfLib();
    const { PDFDocument, PDFName, PDFDict, PDFRef, PDFArray } = lib;
    const doc = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
    const acro = doc.catalog.get(PDFName.of("AcroForm"));
    let acroDict: unknown = acro;
    if (acroDict instanceof PDFRef) acroDict = doc.context.lookup(acroDict);
    if (!(acroDict instanceof PDFDict)) return false;
    const fields = acroDict.lookupMaybe(PDFName.of("Fields"), PDFArray);
    if (!fields) return false;
    for (let i = 0; i < fields.size(); i++) {
      const field = fields.get(i) instanceof PDFRef ? doc.context.lookup(fields.get(i)) : fields.get(i);
      if (!(field instanceof PDFDict)) continue;
      const ft = field.lookupMaybe(PDFName.of("FT"), PDFName)?.decodeText();
      const type = field.lookupMaybe(PDFName.of("Type"), PDFName)?.decodeText();
      if (ft === "Sig" || type === "Sig") return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Build the edited document. Elements are grouped per page and drawn in id
 * order. Replaced (extracted) text areas get a solid white background rect
 * first — which is why the tool asks for light backgrounds when replacing
 * text — then the replacement text is drawn on top. Extracted elements default
 * to the *original* font: the page's own embedded font program (or its exact
 * standard-14 base font) is reused when it can be re-embedded and covers the
 * text; otherwise the measured `fallbackFont` family is used, so a typeface
 * mismatch is always the honest approximation and never an unnoted one. New
 * elements are drawn directly. The original page content, layout and metadata
 * are preserved and only the edited glyphs are added.
 */
export async function buildEditedPdf(
  originalBytes: Uint8Array,
  elements: PdfEditorElement[],
  opts: { fontLoader?: Loader; fontBaseUrl?: string } = {},
): Promise<Uint8Array> {
  const loader = opts.fontLoader ?? defaultLoader;
  const base = opts.fontBaseUrl ?? "/pdfjs-standard-fonts/";
  const lib = await getPdfLib();
  const { PDFDocument, fontkit, rgb } = lib;

  let doc: import("pdf-lib").PDFDocument;
  try {
    doc = await PDFDocument.load(originalBytes, {
      updateMetadata: false,
      ignoreEncryption: false,
    });
  } catch (err) {
    const n = err instanceof Error ? err.name : String(err);
    const m = err instanceof Error ? err.message : String(err);
    if (/encrypted/i.test(n) || /encrypted/i.test(m)) {
      throw new PdfEditorError(
        "encrypted",
        "This PDF is password-protected and cannot be edited without access.",
      );
    }
    throw new PdfEditorError(
      "bad-pdf",
      "This PDF could not be read. It may be corrupted or unsupported.",
    );
  }
  if (elements.some((el) => el.pageNumber < 1 || el.pageNumber > doc.getPageCount())) {
    throw new PdfEditorError(
      "bad-page",
      "An edit refers to a page that does not exist in this PDF.",
    );
  }
  doc.registerFontkit(fontkit);

  const latin = (s: string): boolean => /^[\x00-\xFF\t\n\r ]*$/.test(s);

  const fontCache = new Map<string, AnyFont>();
  const getFont = async (
    id: PdfEditorFontId,
    weight: PdfEditorWeight,
    italic: boolean,
  ): Promise<AnyFont> => {
    const key = `${id}|${weight}|${italic}`;
    const hit = fontCache.get(key);
    if (hit) return hit;
    const suffix = italic ? (weight === "bold" ? "BoldItalic" : "Italic") : weight === "bold" ? "Bold" : "Regular";
    let font: AnyFont | null = null;
    try {
      if (id === "sans") {
        const bytes = await loader(`${base}LiberationSans-${suffix}.ttf`);
        font = await doc.embedFont(bytes, { subset: true });
      } else if (id === "handwriting") {
        const bytes = await loader("/fonts/caveat.ttf");
        font = await doc.embedFont(bytes, { subset: true });
      }
    } catch {
      font = null;
    }
    if (!font) {
      if (id === "serif") {
        font = weight === "bold" && italic
          ? await doc.embedFont("Times-BoldItalic")
          : weight === "bold"
            ? await doc.embedFont("Times-Bold")
            : italic
              ? await doc.embedFont("Times-Italic")
              : await doc.embedFont("Times-Roman");
      } else if (id === "mono") {
        font = weight === "bold" && italic
          ? await doc.embedFont("Courier-BoldOblique")
          : weight === "bold"
            ? await doc.embedFont("Courier-Bold")
            : italic
              ? await doc.embedFont("Courier-Oblique")
              : await doc.embedFont("Courier");
      } else {
        font = weight === "bold" && italic
          ? await doc.embedFont("Helvetica-BoldOblique")
          : weight === "bold"
            ? await doc.embedFont("Helvetica-Bold")
            : italic
              ? await doc.embedFont("Helvetica-Oblique")
              : await doc.embedFont("Helvetica");
      }
    }
    fontCache.set(key, font);
    return font;
  };

  /** One attempt per page+element; caches null so a failed reuse is not retried per element. */
  const reuseCache = new Map<string, AnyFont | null>();
  const resolveOriginalFont = async (
    page: PdfLibPage,
    el: PdfEditorElement,
  ): Promise<AnyFont | null> => {
    const key = `${el.pageNumber}|${el.sourceFontName ?? ""}|${el.sourceFontLabel ?? ""}`;
    if (reuseCache.has(key)) return reuseCache.get(key) ?? null;
    let font: AnyFont | null = null;
    try {
      const res = await sourceFontResource(lib, doc.context, page.node, el);
      if (res) {
        if (res.program) {
          let covered = false;
          try {
            const fk = fontkit.create(res.program);
            covered =
              fk !== null &&
              [...el.text].every((ch) => {
                const g = fk.glyphForCodePoint(ch.codePointAt(0) ?? 0xffff);
                return !!g && g.id !== 0;
              });
          } catch {
            covered = false;
          }
          if (covered) {
            try {
              font = await doc.embedFont(res.program, { subset: true });
            } catch {
              font = null;
            }
          }
        } else if (res.isStandard && res.base) {
          try {
            font = await doc.embedFont(standardVariant(res.base, el.weight, el.italic));
          } catch {
            font = null;
          }
        }
      }
    } catch {
      font = null;
    }
    reuseCache.set(key, font);
    return font;
  };

  const byPage = new Map<number, PdfEditorElement[]>();
  for (const el of elements) {
    const list = byPage.get(el.pageNumber) ?? [];
    list.push(el);
    byPage.set(el.pageNumber, list);
  }

  const drawCover = (
    page: import("pdf-lib").PDFPage,
    rect: { x: number; y: number; width: number; height: number },
  ) => {
    page.drawRectangle({
      x: rect.x,
      y: rect.y - rect.height,
      width: rect.width,
      height: rect.height,
      color: rgb(1, 1, 1),
    });
  };

  for (const [pageNumber, pageElements] of byPage) {
    const page = doc.getPage(pageNumber - 1);
    for (const el of pageElements) {
      const needsLatin = el.text.trim() !== "" && !latin(el.text);
      const font = needsLatin
        ? await doc.embedFont("Helvetica")
        : el.font === "original" && el.source === "extracted"
          ? ((await resolveOriginalFont(page, el)) ??
            (await getFont(el.fallbackFont ?? "sans", el.weight, el.italic)))
          : await getFont(el.font, el.weight, el.italic);
      const col = hexToRgb(el.color);

      const originalCover =
        el.source === "extracted"
          ? (el.coverRect ?? { x: el.x, y: el.y, width: el.width, height: el.height })
          : null;

      if (el.removed) {
        if (originalCover) drawCover(page, originalCover);
        drawCover(page, el);
        continue;
      }
      if (el.text.trim() === "") continue;

      if (el.source === "extracted") {
        if (originalCover) drawCover(page, originalCover);
        if (
          originalCover &&
          (originalCover.x !== el.x ||
            originalCover.y !== el.y ||
            originalCover.width !== el.width ||
            originalCover.height !== el.height)
        ) {
          drawCover(page, el);
        }
      }

      const autoWrap = el.kind === "paragraph" || el.kind === "textbox";
      const lines = autoWrap
        ? wrapText(el.text, el.width, el.fontSize, el.font)
        : el.text.split("\n");
      const step = el.fontSize * el.lineHeight;
      let baseline = el.y - el.fontSize * 0.82;
      const textOpacity = el.opacity ?? 1;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "") {
          baseline -= step;
          continue;
        }
        const lineWidth = font.widthOfTextAtSize(trimmed, el.fontSize);
        let x = el.x;
        if (el.align === "center") x = el.x + (el.width - lineWidth) / 2;
        else if (el.align === "right") x = el.x + el.width - lineWidth;
        const tx = Math.max(0, x);
        page.drawText(trimmed, {
          x: tx,
          y: baseline,
          size: el.fontSize,
          font,
          color: rgb(col.r / 255, col.g / 255, col.b / 255),
          lineHeight: step,
          opacity: textOpacity,
        });
        if (el.underline) {
          const lineY = baseline - el.fontSize * 0.06;
          page.drawLine({
            start: { x: tx, y: lineY },
            end: { x: tx + lineWidth, y: lineY },
            thickness: Math.max(0.5, el.fontSize * 0.04),
            color: rgb(col.r / 255, col.g / 255, col.b / 255),
            opacity: textOpacity,
          });
        }
        baseline -= step;
      }

      if (el.link && el.text.trim() !== "") {
        try {
          const { PDFName: PN, PDFArray: PA } = lib;
          const annot = doc.context.obj({});
          annot.set(PN.of("Type"), PN.of("Annot"));
          annot.set(PN.of("Subtype"), PN.of("Link"));
          const annotRect = doc.context.obj([
            el.x,
            el.y - el.height,
            el.x + el.width,
            el.y,
          ]);
          annot.set(PN.of("Rect"), annotRect);
          const action = doc.context.obj({});
          action.set(PN.of("URI"), PDFString.of(el.link));
          annot.set(PN.of("A"), action);
          annot.set(PN.of("Border"), doc.context.obj([0, 0, 0]));
          const annots = page.node.lookupMaybe(PN.of("Annots"), PA);
          if (annots) {
            annots.push(doc.context.register(annot));
          } else {
            page.node.set(PN.of("Annots"), doc.context.obj([doc.context.register(annot)]));
          }
        } catch {
          // link annotation failures are non-fatal
        }
      }
    }
  }

  const out = await doc.save({ updateFieldAppearances: false });
  return new Uint8Array(out);
}