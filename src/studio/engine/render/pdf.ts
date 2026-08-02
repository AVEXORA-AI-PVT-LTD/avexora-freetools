import { PDFDocument, StandardFonts, type PDFFont, type PDFPage, rgb } from "pdf-lib";
import {
  type DocSpec,
  type Element,
  type Paint,
  type TextElement,
  MM_TO_PT,
  bleedBox,
} from "../doc-spec";
import { parseHex } from "../color";
import { lineHeightFor, measureBlock } from "./text-layout";
import { parseSvgSubset, type SvgNode } from "./svg-subset";
import { resolveFont } from "./fonts-pdf";

/**
 * DocSpec → print-ready PDF (spec 22 §3.2).
 *
 * True vector output: shapes become PDF path operators and text becomes real
 * text, so a letterhead stays crisp at any size and remains selectable and
 * searchable. Nothing is rasterised.
 *
 * Coordinates: DocSpec is top-left origin with y increasing downward; PDF is
 * bottom-left with y increasing upward. `flip()` is the single place that
 * conversion happens.
 */

const isMm = (spec: DocSpec) => spec.size.unit === "mm";

function color(hex: string) {
  const { r, g, b } = parseHex(hex.length > 7 ? hex.slice(0, 7) : hex);
  return rgb(r / 255, g / 255, b / 255);
}

function paintColor(paint: Paint | undefined): ReturnType<typeof rgb> | undefined {
  if (!paint) return undefined;
  // PDF has no cheap gradient primitive in pdf-lib; a linear gradient is
  // approximated by its midpoint. Layouts use gradients only for decorative
  // bands, never for anything carrying information.
  if (paint.type === "linear") {
    const from = parseHex(paint.from);
    const to = parseHex(paint.to);
    return rgb(
      (from.r + to.r) / 2 / 255,
      (from.g + to.g) / 2 / 255,
      (from.b + to.b) / 2 / 255,
    );
  }
  return color(paint.color);
}

function paintOpacity(paint: Paint | undefined): number | undefined {
  return paint && paint.type === "solid" ? paint.opacity : undefined;
}

interface Ctx {
  page: PDFPage;
  /** Document units → PDF points. */
  k: number;
  /** Page height in PDF points, for the y flip. */
  pageH: number;
  /** Bleed offset in document units. */
  offset: number;
  regular: PDFFont;
  bold: PDFFont;
  serifRegular: PDFFont;
  serifBold: PDFFont;
  monoRegular: PDFFont;
  monoBold: PDFFont;
}

/** Document-space point → PDF point. */
function tx(ctx: Ctx, x: number): number {
  return (x + ctx.offset) * ctx.k;
}
function ty(ctx: Ctx, y: number): number {
  return ctx.pageH - (y + ctx.offset) * ctx.k;
}

function fontFor(ctx: Ctx, stack: string, bold: boolean): PDFFont {
  const resolved = resolveFont(stack, bold);
  const name = String(resolved.standard);
  if (name.startsWith("Times")) return bold ? ctx.serifBold : ctx.serifRegular;
  if (name.startsWith("Courier")) return bold ? ctx.monoBold : ctx.monoRegular;
  return bold ? ctx.bold : ctx.regular;
}

function drawText(ctx: Ctx, el: TextElement) {
  const { style } = el;
  const bold = (style.fontWeight ?? 400) >= 600;
  const font = fontFor(ctx, style.fontFamily, bold);
  const sizePt = style.fontSize * ctx.k;
  const { lines } = measureBlock(el.text, style, el.w);
  const lh = lineHeightFor(style);

  let firstTop = el.y;
  if (el.h && el.verticalAlign === "middle") {
    firstTop = el.y + (el.h - lines.length * lh) / 2;
  } else if (el.h && el.verticalAlign === "bottom") {
    firstTop = el.y + el.h - lines.length * lh;
  }

  const align = style.align ?? "left";

  lines.forEach((lineText, i) => {
    if (!lineText) return;
    // Real font metrics here — this is more accurate than the estimator used
    // for wrapping, and only alignment depends on it.
    const widthPt = font.widthOfTextAtSize(lineText, sizePt);
    let xPt = tx(ctx, el.x);
    if (align === "center") {
      xPt = tx(ctx, el.x + (el.w ?? 0) / 2) - widthPt / 2;
    } else if (align === "right") {
      xPt = tx(ctx, el.x + (el.w ?? 0)) - widthPt;
    }

    // pdf-lib positions text by its baseline; DocSpec positions by the line's
    // top edge, so drop by the ascent-ish fraction of the size.
    const baselineY = ty(ctx, firstTop + i * lh) - sizePt * 0.82;

    ctx.page.drawText(lineText, {
      x: xPt,
      y: baselineY,
      size: sizePt,
      font,
      color: color(style.color),
      opacity: style.opacity,
    });
  });
}

/** Replay a parsed SVG node inside a box placed at (bx, by) with scale `s`. */
function drawSvgNode(ctx: Ctx, node: SvgNode, bx: number, by: number, s: number) {
  const t = node.transform;
  // Node-local → document space.
  const px = (x: number) => bx + (t.tx + x * t.sx) * s;
  const py = (y: number) => by + (t.ty + y * t.sy) * s;
  const ps = (v: number, axis: "x" | "y" = "x") =>
    v * (axis === "x" ? t.sx : t.sy) * s;

  switch (node.kind) {
    case "rect": {
      const w = ps(node.w);
      const h = ps(node.h, "y");
      ctx.page.drawRectangle({
        x: tx(ctx, px(node.x)),
        y: ty(ctx, py(node.y)) - h * ctx.k,
        width: w * ctx.k,
        height: h * ctx.k,
        color: node.fill ? color(node.fill) : undefined,
        borderColor: node.stroke ? color(node.stroke) : undefined,
        borderWidth: node.stroke ? ps(node.strokeWidth) * ctx.k : undefined,
        opacity: node.opacity,
        borderOpacity: node.opacity,
      });
      break;
    }
    case "circle":
      ctx.page.drawCircle({
        x: tx(ctx, px(node.cx)),
        y: ty(ctx, py(node.cy)),
        size: ps(node.r) * ctx.k,
        color: node.fill ? color(node.fill) : undefined,
        borderColor: node.stroke ? color(node.stroke) : undefined,
        borderWidth: node.stroke ? ps(node.strokeWidth) * ctx.k : undefined,
        opacity: node.opacity,
        borderOpacity: node.opacity,
      });
      break;
    case "ellipse":
      ctx.page.drawEllipse({
        x: tx(ctx, px(node.cx)),
        y: ty(ctx, py(node.cy)),
        xScale: ps(node.rx) * ctx.k,
        yScale: ps(node.ry, "y") * ctx.k,
        color: node.fill ? color(node.fill) : undefined,
        borderColor: node.stroke ? color(node.stroke) : undefined,
        borderWidth: node.stroke ? ps(node.strokeWidth) * ctx.k : undefined,
        opacity: node.opacity,
      });
      break;
    case "line":
      ctx.page.drawLine({
        start: { x: tx(ctx, px(node.x1)), y: ty(ctx, py(node.y1)) },
        end: { x: tx(ctx, px(node.x2)), y: ty(ctx, py(node.y2)) },
        color: color(node.stroke),
        thickness: ps(node.strokeWidth) * ctx.k,
        opacity: node.opacity,
      });
      break;
    case "path":
      // drawSvgPath takes path data in SVG (y-down) space and positions the
      // path origin at (x, y) in PDF space — exactly what we need.
      ctx.page.drawSvgPath(node.d, {
        x: tx(ctx, px(0)),
        y: ty(ctx, py(0)),
        scale: t.sx * s * ctx.k,
        color: node.fill ? color(node.fill) : undefined,
        borderColor: node.stroke ? color(node.stroke) : undefined,
        borderWidth: node.stroke ? ps(node.strokeWidth) * ctx.k : undefined,
        opacity: node.opacity,
        borderOpacity: node.opacity,
      });
      break;
    case "text": {
      const bold = node.fontWeight >= 600;
      const font = fontFor(ctx, node.fontFamily ?? "Inter", bold);
      const sizePt = ps(node.fontSize) * ctx.k;
      const widthPt = font.widthOfTextAtSize(node.text, sizePt);
      let xPt = tx(ctx, px(node.x));
      if (node.anchor === "middle") xPt -= widthPt / 2;
      else if (node.anchor === "end") xPt -= widthPt;

      // `dominant-baseline: central` centres glyphs on y; approximate with
      // half the cap height so monograms sit centred in their container.
      const yPt =
        ty(ctx, py(node.y)) - (node.baseline === "central" ? sizePt * 0.35 : 0);

      ctx.page.drawText(node.text, {
        x: xPt,
        y: yPt,
        size: sizePt,
        font,
        color: color(node.fill),
        opacity: node.opacity,
      });
      break;
    }
  }
}

function drawElement(ctx: Ctx, el: Element) {
  switch (el.kind) {
    case "text":
      drawText(ctx, el);
      break;

    case "rect": {
      const h = el.h * ctx.k;
      ctx.page.drawRectangle({
        x: tx(ctx, el.x),
        y: ty(ctx, el.y) - h,
        width: el.w * ctx.k,
        height: h,
        color: paintColor(el.fill),
        opacity: paintOpacity(el.fill) ?? el.opacity,
        borderColor: el.stroke ? color(el.stroke.color) : undefined,
        borderWidth: el.stroke ? el.stroke.width * ctx.k : undefined,
      });
      break;
    }

    case "line":
      ctx.page.drawLine({
        start: { x: tx(ctx, el.x), y: ty(ctx, el.y) },
        end: { x: tx(ctx, el.x2), y: ty(ctx, el.y2) },
        color: color(el.color),
        thickness: el.width * ctx.k,
        opacity: el.opacity,
        dashArray: el.dash?.map((d) => d * ctx.k),
      });
      break;

    case "ellipse":
      ctx.page.drawEllipse({
        x: tx(ctx, el.x),
        y: ty(ctx, el.y),
        xScale: el.rx * ctx.k,
        yScale: el.ry * ctx.k,
        color: paintColor(el.fill),
        borderColor: el.stroke ? color(el.stroke.color) : undefined,
        borderWidth: el.stroke ? el.stroke.width * ctx.k : undefined,
        opacity: paintOpacity(el.fill) ?? el.opacity,
      });
      break;

    case "svg": {
      const [, , vbW, vbH] = el.viewBox.split(/\s+/).map(Number);
      // Fit the viewBox into the element box, preserving aspect ratio.
      const scale =
        el.fit === false
          ? el.w / vbW
          : Math.min(el.w / vbW, el.h / vbH);
      const drawnW = vbW * scale;
      const drawnH = vbH * scale;
      const ox = el.x + (el.fit === false ? 0 : (el.w - drawnW) / 2);
      const oy = el.y + (el.fit === false ? 0 : (el.h - drawnH) / 2);
      for (const node of parseSvgSubset(el.content)) {
        drawSvgNode(ctx, node, ox, oy, scale);
      }
      break;
    }

    case "image":
      // Images are embedded by the caller (they need async work); the layout
      // modules that use them pre-embed and pass a data URI, handled in
      // `renderPdf` before element drawing.
      break;
  }
}

async function embedImages(pdf: PDFDocument, spec: DocSpec) {
  const embedded = new Map<string, Awaited<ReturnType<typeof pdf.embedPng>>>();
  for (const el of spec.elements) {
    if (el.kind !== "image" || embedded.has(el.href)) continue;
    const match = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(el.href);
    if (!match) continue;
    const bytes = Buffer.from(match[2], "base64");
    embedded.set(
      el.href,
      match[1].toLowerCase() === "png"
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes),
    );
  }
  return embedded;
}

function drawCropMarks(ctx: Ctx, spec: DocSpec) {
  const b = spec.bleed ?? 0;
  if (!b || !spec.cropMarks) return;
  const len = Math.min(b * 0.8, 4);
  const corners: [number, number, number, number][] = [
    [0, 0, -1, -1],
    [spec.size.w, 0, 1, -1],
    [0, spec.size.h, -1, 1],
    [spec.size.w, spec.size.h, 1, 1],
  ];
  const thickness = Math.max(b * 0.06, 0.1) * ctx.k;
  for (const [x, y, dx, dy] of corners) {
    ctx.page.drawLine({
      start: { x: tx(ctx, x + dx * (b - len)), y: ty(ctx, y) },
      end: { x: tx(ctx, x + dx * b), y: ty(ctx, y) },
      color: rgb(0, 0, 0),
      thickness,
    });
    ctx.page.drawLine({
      start: { x: tx(ctx, x), y: ty(ctx, y + dy * (b - len)) },
      end: { x: tx(ctx, x), y: ty(ctx, y + dy * b) },
      color: rgb(0, 0, 0),
      thickness,
    });
  }
}

/**
 * Render one or more DocSpecs into a single PDF. Multiple specs become
 * multiple pages, which is how a batch of employee ID cards or a multi-page
 * brand guidelines document is produced.
 */
export async function renderPdf(
  specs: DocSpec | DocSpec[],
  options: { title?: string; author?: string } = {},
): Promise<Uint8Array> {
  const pages = Array.isArray(specs) ? specs : [specs];
  const pdf = await PDFDocument.create();

  const [regular, bold, serifRegular, serifBold, monoRegular, monoBold] =
    await Promise.all([
      pdf.embedFont(StandardFonts.Helvetica),
      pdf.embedFont(StandardFonts.HelveticaBold),
      pdf.embedFont(StandardFonts.TimesRoman),
      pdf.embedFont(StandardFonts.TimesRomanBold),
      pdf.embedFont(StandardFonts.Courier),
      pdf.embedFont(StandardFonts.CourierBold),
    ]);

  pdf.setTitle(options.title ?? pages[0]?.meta?.title ?? "Avexora Brand Studio");
  pdf.setProducer("Avexora Brand Studio");
  pdf.setCreator("Avexora Brand Studio");
  if (options.author) pdf.setAuthor(options.author);

  for (const spec of pages) {
    const box = bleedBox(spec);
    // mm documents convert to points; px documents are treated as 1px = 1pt so
    // a 1080px social post exports at a sane physical size.
    const k = isMm(spec) ? MM_TO_PT : 1;
    const page = pdf.addPage([box.w * k, box.h * k]);

    const ctx: Ctx = {
      page,
      k,
      pageH: box.h * k,
      offset: spec.bleed ?? 0,
      regular,
      bold,
      serifRegular,
      serifBold,
      monoRegular,
      monoBold,
    };

    if (spec.background) {
      page.drawRectangle({
        x: 0,
        y: 0,
        width: box.w * k,
        height: box.h * k,
        color: paintColor(spec.background),
        opacity: paintOpacity(spec.background),
      });
    }

    const images = await embedImages(pdf, spec);

    for (const el of spec.elements) {
      if (el.kind === "image") {
        const img = images.get(el.href);
        if (!img) continue;
        page.drawImage(img, {
          x: tx(ctx, el.x),
          y: ty(ctx, el.y) - el.h * k,
          width: el.w * k,
          height: el.h * k,
          opacity: el.opacity,
        });
        continue;
      }
      drawElement(ctx, el);
    }

    drawCropMarks(ctx, spec);
  }

  return pdf.save();
}
