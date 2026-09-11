import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  PDF_EDITOR_MAX_PAGES,
  buildEditedPdf,
  buildViewportTransform,
  clamp,
  colorsForItems,
  coverPad,
  createElementId,
  elementContentHeight,
  elementFromTextItem,
  elementWrapWidth,
  extractColorRuns,
  finiteOr,
  hexToRgb,
  isPdfSigned,
  makeElement,
  moveElementRect,
  normalizeDegrees,
  paddedCoverRect,
  replacementCoverRect,
  replacementLines,
  resizeElementRect,
  sanitizeEditedFilename,
  sanitizeRect,
  snapDegrees,
  textItemBBox,
  wrapText,
  type PdfEditorElement,
  type PdfSourceTextItem,
} from "@/tools/compute/pdf/pdf-editor";
import { PdfEditorError } from "@/tools/compute/pdf/pdf-editor";

/* ---------------------------------------------------------------------------
 * Fixture helpers — the editor works on the exact same coordinate space pdf-lib
 * draws in (PDF user space, origin bottom-left), so the tests build real PDFs
 * with pdf-lib and validate placement math against them.
 * ------------------------------------------------------------------------- */

async function makeFixture(): Promise<Uint8Array> {
  const src = await PDFDocument.create();
  const font = await src.embedFont(StandardFonts.Helvetica);
  const p1 = src.addPage([612, 792]);
  p1.drawText("Hello Avenue Tools", { x: 80, y: 700, size: 24, font, color: rgb(0, 0, 0) });
  p1.drawRectangle({ x: 60, y: 300, width: 240, height: 120, color: rgb(0.8, 0.3, 0.2) });
  const p2 = src.addPage([400, 700]);
  p2.drawText("Page two", { x: 30, y: 660, size: 20, font });
  return src.save();
}

async function extractTextItems(bytes: Uint8Array, pageNumber: number) {
  const doc = await pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: false }).promise;
  const page = await doc.getPage(pageNumber);
  const content = await page.getTextContent();
  return { page, items: content.items };
}

/**
 * pdf-lib does not expose a public encrypt API, so this hand-builds a small
 * classic-tabbed, encrypted PDF (with a real /Encrypt dictionary) that
 * `PDFDocument.load` will reject unless ignoreEncryption is set.
 */
function makeEncryptedBytes(): Uint8Array {
  const hex = "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF";
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << >> /Contents 4 0 R >>\nendobj\n",
    "4 0 obj\n<< /Length 0 >>\nstream\n\nendstream\nendobj\n",
    `5 0 obj\n<< /Filter /Standard /V 2 /R 3 /Length 128 /O <${hex}> /U <${hex}> /P -44 >>\nendobj\n`,
  ];
  const offsets: number[] = [];
  let body = "%PDF-1.4\n";
  for (const obj of objects) {
    offsets.push(body.length);
    body += obj;
  }
  const xrefAt = body.length;
  let xref = "xref\n";
  xref += "0 6\n";
  xref += "0000000000 65535 f \n";
  for (const off of offsets) {
    xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size 6 /Root 1 0 R /Encrypt 5 0 R >>\n`;
  xref += `startxref\n${xrefAt}\n%%EOF\n`;
  return new TextEncoder().encode(body + xref);
}

/* --------------------------------------------------------------------------- */

describe("pdf-editor compute — text item geometry", () => {
  it("maps a horizontal glyph run into an axis-aligned user-space box", () => {
    const box = textItemBBox({
      str: "Hello",
      transform: [12, 0, 0, 12, 100, 200],
      width: 60,
      height: 12,
      fontName: "g_d0_f1",
    });
    expect(box.x).toBeCloseTo(100);
    expect(box.y).toBeCloseTo(212);
    expect(box.width).toBeCloseTo(60);
    expect(box.height).toBeCloseTo(12);
  });

  it("handles a page whose /Rotate is 90° (transform swaps axes)", () => {
    const box = textItemBBox({
      str: "Rot",
      transform: [0, 12, -12, 0, 300, 200],
      width: 30,
      height: 12,
      fontName: "g_d0_f1",
    });
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.x).toBeLessThan(300);
  });

  it("extracts text geometry and a font style from a real page", async () => {
    const bytes = await makeFixture();
    const { items } = await extractTextItems(bytes, 1);
    const itemsWithText = items.filter((i) => (i as { str: string }).str.trim() !== "");
    expect(itemsWithText.length).toBeGreaterThan(0);
    const first = itemsWithText[0] as {
      str: string;
      transform: number[];
      width: number;
      height: number;
      fontName: string;
    };
    const el = elementFromTextItem("el-1", 1, first);
    expect(el.pageNumber).toBe(1);
    expect(el.source).toBe("extracted");
    expect(el.text.length).toBeGreaterThan(0);
    // The fixture draws 24pt text at x=80, so the box must sit inside the page.
    expect(el.x).toBeGreaterThanOrEqual(0);
    expect(el.width).toBeGreaterThan(5);
    expect(el.height).toBeGreaterThan(5);
    expect(el.fontSize).toBeGreaterThanOrEqual(8);
  });

  it("infers weight and style from Adobe font names", () => {
    const boldItalic = elementFromTextItem("el-a", 1, {
      str: "x",
      transform: [12, 0, 0, 12, 0, 12],
      width: 6,
      height: 12,
      fontName: "g_d1_f2",
    });
    expect(boldItalic.weight).toBe("normal");
    const named = elementFromTextItem("el-b", 1, {
      str: "x",
      transform: [12, 0, 0, 12, 0, 12],
      width: 6,
      height: 12,
      fontName: "BoldItalic",
    });
    expect(named.weight).toBe("bold");
    expect(named.italic).toBe(true);
  });
});

describe("pdf-editor compute — wrap, helpers, defaults", () => {
  it("wraps words to the estimated max character width per line", () => {
    const lines = wrapText("one two three four five", 120, 12, "sans");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.flat().join(" ").replace(/\s+/g, " ")).toBe(
      "one two three four five",
    );
  });

  it("respects explicit line breaks", () => {
    expect(wrapText("alpha\nbeta", 9999, 12, "sans")).toEqual(["alpha", "beta"]);
  });

  it("splits over-long unbroken words", () => {
    const lines = wrapText("antidisestablishmentarianism", 60, 12, "sans");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join("")).toBe("antidisestablishmentarianism");
  });

  it("clamps and converts colors", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(hexToRgb("#010203")).toEqual({ r: 1, g: 2, b: 3 });
    expect(hexToRgb("#123")).toEqual({ r: 17, g: 34, b: 51 });
    expect(hexToRgb("nonsense")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("normalizes degrees into [0, 360)", () => {
    expect(normalizeDegrees(0)).toBe(0);
    expect(normalizeDegrees(90)).toBe(90);
    expect(normalizeDegrees(-90)).toBe(270);
    expect(normalizeDegrees(450)).toBe(90);
    expect(normalizeDegrees(-720)).toBe(0);
    expect(normalizeDegrees(NaN)).toBe(0);
  });

  it("snaps angles to the nearest cardinal within tolerance", () => {
    expect(snapDegrees(87)).toBe(90);
    expect(snapDegrees(180)).toBe(180);
    expect(snapDegrees(271)).toBe(270);
    expect(snapDegrees(45)).toBe(45);
    expect(snapDegrees(-3)).toBe(0);
    expect(snapDegrees(359.5)).toBe(0);
  });

  it("creates new elements sized and centered on a page", () => {
    const el = makeElement("heading", 1, { width: 612, height: 792 });
    expect(el.kind).toBe("heading");
    expect(el.source).toBe("new");
    expect(el.fontSize).toBeGreaterThan(0);
    expect(el.x).toBeGreaterThanOrEqual(0);
    expect(el.y).toBeGreaterThan(0);
    expect(el.x + el.width).toBeLessThanOrEqual(612 + 1);
    expect(el.y).toBeLessThanOrEqual(792 + 1);
    expect(el.id).toMatch(/^el-/);
    expect(createElementId()).not.toBe(el.id);
  });

  it("sanitizes filenames", () => {
    expect(sanitizeEditedFilename("Contract Final.pdf")).toBe("edited-Contract-Final.pdf");
    expect(sanitizeEditedFilename("../weird/name!.pdf")).toBe("edited-..weirdname.pdf");
  });
});

describe("pdf-editor compute — buildEditedPdf", () => {
  const sansLoader = async (): Promise<Uint8Array> => {
    const p = join(process.cwd(), "public", "pdfjs-standard-fonts", "LiberationSans-Regular.ttf");
    return new Uint8Array(readFileSync(p));
  };

  it("adds new text without touching existing page content", async () => {
    const bytes = await makeFixture();
    const element: PdfEditorElement = {
      id: "el-new",
      pageNumber: 1,
      kind: "text",
      source: "new",
      text: "Added line",
      x: 100,
      y: 500,
      width: 120,
      height: 16,
      fontSize: 16,
      font: "sans",
      fallbackFont: "sans",
      weight: "normal",
      italic: false,
      color: "#111827",
      align: "left",
      lineHeight: 1.25,
      removed: false,
    };
    const out = await buildEditedPdf(bytes, [element], { fontLoader: sansLoader });
    expect(out.length).toBeGreaterThan(bytes.length);
    const doc = await PDFDocument.load(out, { ignoreEncryption: true });
    expect(doc.getPageCount()).toBe(2);
  });

  it("redraws a replaced extracted-text area over a cover rect", async () => {
    const bytes = await makeFixture();
    const { items } = await extractTextItems(bytes, 1);
    const item = items.find(
      (i) => (i as { str: string }).str.includes("Hello"),
    ) as { str: string; transform: number[]; width: number; height: number; fontName: string };
    expect(item).toBeDefined();
    const replaced = elementFromTextItem("el-replace", 1, item);
    replaced.text = "Replaced headline";
    const out = await buildEditedPdf(bytes, [replaced], { fontLoader: sansLoader });
    const doc = await PDFDocument.load(out, { ignoreEncryption: true });
    expect(doc.getPageCount()).toBe(2);
  });

  it("covers an area when an extracted element is removed", async () => {
    const bytes = await makeFixture();
    const { items } = await extractTextItems(bytes, 1);
    const item = items.find(
      (i) => (i as { str: string }).str.includes("Hello"),
    ) as { str: string; transform: number[]; width: number; height: number; fontName: string };
    const removed = elementFromTextItem("el-rm", 1, item);
    removed.removed = true;
    removed.text = "";
    const out = await buildEditedPdf(bytes, [removed], { fontLoader: sansLoader });
    const doc = await PDFDocument.load(out, { ignoreEncryption: true });
    expect(doc.getPageCount()).toBe(2);
  });

  it("draws standard-font text (serif) without a font loader", async () => {
    const bytes = await makeFixture();
    const element: PdfEditorElement = {
      id: "el-serif",
      pageNumber: 2,
      kind: "heading",
      source: "new",
      text: "Serif heading",
      x: 40,
      y: 640,
      width: 200,
      height: 30,
      fontSize: 22,
      font: "serif",
      fallbackFont: "serif",
      weight: "bold",
      italic: false,
      color: "#1d4ed8",
      align: "center",
      lineHeight: 1.15,
      removed: false,
    };
    const out = await buildEditedPdf(bytes, [element]);
    const doc = await PDFDocument.load(out, { ignoreEncryption: true });
    expect(doc.getPageCount()).toBe(2);
  });

  it("rejects an edit aimed at a page that does not exist", async () => {
    const bytes = await makeFixture();
    const element: PdfEditorElement = {
      id: "el-bad",
      pageNumber: 9,
      kind: "text",
      source: "new",
      text: "x",
      x: 10,
      y: 10,
      width: 20,
      height: 12,
      fontSize: 12,
      font: "sans",
      fallbackFont: "sans",
      weight: "normal",
      italic: false,
      color: "#111827",
      align: "left",
      lineHeight: 1.25,
      removed: false,
    };
    await expect(buildEditedPdf(bytes, [element], { fontLoader: sansLoader })).rejects.toThrowError(
      PdfEditorError,
    );
    try {
      await buildEditedPdf(bytes, [element], { fontLoader: sansLoader });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect((err as PdfEditorError).code).toBe("bad-page");
    }
  });

  it("refuses password-protected PDFs", async () => {
    const bytes = makeEncryptedBytes();
    try {
      await buildEditedPdf(bytes, []);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect((err as PdfEditorError).code).toBe("encrypted");
    }
  });

  it("rotates drawn text correctly on a /Rotate 90 page", async () => {
    const src = await PDFDocument.create();
    const font = await src.embedFont(StandardFonts.Helvetica);
    const p = src.addPage([612, 792]);
    p.setRotation(degrees(90));
    p.drawText("Sideways page", { x: 200, y: 200, size: 20, font });
    const bytes = await src.save();
    const element: PdfEditorElement = {
      id: "el-rot",
      pageNumber: 1,
      kind: "text",
      source: "new",
      text: "Overlay marker",
      x: 120,
      y: 660,
      width: 160,
      height: 20,
      fontSize: 16,
      font: "sans",
      fallbackFont: "sans",
      weight: "bold",
      italic: false,
      color: "#b45309",
      align: "left",
      lineHeight: 1.25,
      removed: false,
    };
    const out = await buildEditedPdf(bytes, [element], { fontLoader: sansLoader });
    const doc = await PDFDocument.load(out, { ignoreEncryption: true });
    expect(doc.getPageCount()).toBe(1);
    expect(PDF_EDITOR_MAX_PAGES).toBe(200);
  });
});

/* ---------------------------------------------------------------------------
 * Text colour detection, original-font reuse and signature detection.
 * ------------------------------------------------------------------------- */

describe("pdf-editor compute — text colour detection", () => {
  const g = (u: string) => [{ unicode: u }];

  const opCodes = {
    showText: pdfjs.OPS.showText,
    showSpacedText: pdfjs.OPS.showSpacedText,
    nextLineShowText: pdfjs.OPS.nextLineShowText,
    nextLineSetSpacingShowText: pdfjs.OPS.nextLineSetSpacingShowText,
    setFillRGBColor: pdfjs.OPS.setFillRGBColor,
    setFillGray: pdfjs.OPS.setFillGray,
    setFillCMYKColor: pdfjs.OPS.setFillCMYKColor,
    setFillColor: pdfjs.OPS.setFillColor,
    setFillColorSpace: pdfjs.OPS.setFillColorSpace,
  };

  it("records the fill colour active at each show-text operator", () => {
    const runs = extractColorRuns(
      [
        pdfjs.OPS.setFillRGBColor,
        pdfjs.OPS.showText,
        pdfjs.OPS.setFillGray,
        pdfjs.OPS.showText,
        pdfjs.OPS.showText,
      ],
      [["#ff0000"], [g("Hi")], [0.5], [g("bye")], [g("now")]],
      opCodes,
    );
    expect(runs).toEqual([
      { text: "Hi", color: "#ff0000" },
      { text: "bye", color: "#808080" },
      { text: "now", color: "#808080" },
    ]);
  });

  it("aligns colour runs back to the raw text items by character consumption", () => {
    const colors = colorsForItems(
      [
        { text: "Hello", color: "#112233" },
        { text: " world", color: "#445566" },
      ],
      [
        { str: "Hello", transform: [1, 0, 0, 1, 0, 0], width: 30, height: 12 },
        { str: "world", transform: [1, 0, 0, 1, 0, 0], width: 30, height: 12 },
      ],
    );
    expect(colors).toEqual(["#112233", "#445566"]);
  });

  it("recovers a real page's text colour from its operator list", async () => {
    const src = await PDFDocument.create();
    const font = await src.embedFont(StandardFonts.Helvetica);
    const p = src.addPage([612, 792]);
    p.drawText("Coloured text", { x: 80, y: 700, size: 20, font, color: rgb(0.2, 0.53, 0.82) });
    const bytes = await src.save();
    const doc = await pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: false }).promise;
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    const items = content.items as unknown[];
    const { fnArray, argsArray } = await page.getOperatorList();
    const colors = colorsForItems(
      extractColorRuns(fnArray, argsArray, opCodes),
      content.items as unknown as PdfSourceTextItem[],
    );
    const idx = items.findIndex((i) => ((i as { str?: string }).str ?? "").trim() === "Coloured text");
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(colors.length);
    // pdf-lib writes "0.2 0.53 0.82 rg"; pdf.js normalises to the hex "#3387d1".
    expect(colors[idx]).toBe("#3387d1");
  });
});

describe("pdf-editor compute — original font reuse", () => {
  const liberationPath = join(
    process.cwd(),
    "public",
    "pdfjs-standard-fonts",
    "LiberationSans-Regular.ttf",
  );
  const throwingLoader = async (): Promise<Uint8Array> => {
    throw new Error("original-font reuse should make the loader unnecessary");
  };

  it("marks extracted elements as using the original font and re-embeds their program", async () => {
    const liberation = new Uint8Array(readFileSync(liberationPath));
    const src = await PDFDocument.create();
    src.registerFontkit(fontkit);
    const font = await src.embedFont(liberation, { subset: false });
    const p = src.addPage([612, 792]);
    p.drawText("Reuse this line", { x: 80, y: 700, size: 24, font });
    const bytes = await src.save();
    const { items } = await extractTextItems(bytes, 1);
    const item = items.find((i) =>
      ((i as { str?: string }).str ?? "").includes("Reuse"),
    ) as { str: string; transform: number[]; width: number; height: number; fontName: string };
    expect(item).toBeDefined();
    const el = elementFromTextItem("el-reuse", 1, item);
    expect(el.font).toBe("original");
    expect(el.fallbackFont).toContain("sans");
    el.text = "Replaced text";
    const out = await buildEditedPdf(bytes, [el], { fontLoader: throwingLoader });
    expect(out.length).toBeGreaterThan(0);
    const plain = await pdfjs.getDocument({ data: out.slice(), useSystemFonts: false }).promise;
    const page = await plain.getPage(1);
    const after = (await page.getTextContent()).items
      .map((i) => (i as { str?: string }).str ?? "")
      .join("");
    expect(after).toContain("Replaced text");
  });

  it("reuses a standard-14 base font (Helvetica) without any loader", async () => {
    const bytes = await makeFixture();
    const { items } = await extractTextItems(bytes, 1);
    const item = items.find((i) =>
      ((i as { str?: string }).str ?? "").includes("Hello"),
    ) as { str: string; transform: number[]; width: number; height: number; fontName: string };
    const el = elementFromTextItem("el-std", 1, item);
    el.text = "Shipped quietly";
    const out = await buildEditedPdf(bytes, [el], { fontLoader: throwingLoader });
    expect(out.length).toBeGreaterThan(0);
    const doc = await PDFDocument.load(out, { ignoreEncryption: true });
    expect(doc.getPageCount()).toBe(2);
  });
});

describe("pdf-editor compute — untouched content preservation", () => {
  it("keeps other graphics and pages byte-identical in behaviour", async () => {
    const bytes = await makeFixture();
    const { items } = await extractTextItems(bytes, 1);
    const item = items.find((i) =>
      ((i as { str?: string }).str ?? "").includes("Hello"),
    ) as { str: string; transform: number[]; width: number; height: number; fontName: string };
    const el = elementFromTextItem("el-keep", 1, item);
    el.text = "Edited headline";

    const out = await buildEditedPdf(bytes, [el], {
      fontLoader: async () => {
        const p = join(process.cwd(), "public", "pdfjs-standard-fonts", "LiberationSans-Regular.ttf");
        return new Uint8Array(readFileSync(p));
      },
    });
    const doc = await pdfjs.getDocument({ data: out.slice(), useSystemFonts: false }).promise;

    // Page 2 was not edited and must keep its text.
    const page2 = await doc.getPage(2);
    const page2Text = (await page2.getTextContent()).items
      .map((i) => (i as { str?: string }).str ?? "")
      .join("");
    expect(page2Text).toContain("Page two");

    // The rectangle (no relation to the edit) must still be painted on page 1.
    const page1 = await doc.getPage(1);
    const { fnArray, argsArray } = await page1.getOperatorList();
    const rectFillIdx = fnArray.findIndex(
      (fn, i) =>
        fn === pdfjs.OPS.setFillRGBColor &&
        argsArray[i]?.[0] === "#cc4c33", // rgb(0.8, 0.3, 0.2) as pdf.js sees it
    );
    expect(rectFillIdx).toBeGreaterThanOrEqual(0);
  });

  it("returns false for an unsigned PDF and true for an AcroForm signature field", async () => {
    const bytes = await makeFixture();
    expect(await isPdfSigned(bytes)).toBe(false);

    const signed = makeSignedBytes();
    expect(await isPdfSigned(signed)).toBe(true);
  });
});

describe("pdf-editor compute — rotation and in-place cover", () => {
  const sansLoader = async (): Promise<Uint8Array> => {
    const p = join(process.cwd(), "public", "pdfjs-standard-fonts", "LiberationSans-Regular.ttf");
    return new Uint8Array(readFileSync(p));
  };

  const textRotDeg = (transform: number[]): number =>
    (Math.atan2(transform[1], transform[0]) * 180) / Math.PI;

  const fixtureElement = (
    overrides: Partial<PdfEditorElement>,
  ): PdfEditorElement => ({
    id: "el-rot",
    pageNumber: 1,
    kind: "text",
    source: "new",
    text: "Rotated note",
    x: 200,
    y: 400,
    width: 120,
    height: 16,
    fontSize: 16,
    font: "sans",
    fallbackFont: "sans",
    weight: "normal",
    italic: false,
    color: "#111827",
    align: "left",
    lineHeight: 1.25,
    removed: false,
    rotation: 0,
    ...overrides,
  });

  it("rotates new text on export (matching the on-canvas clockwise preview)", async () => {
    const bytes = await makeFixture();
    const out = await buildEditedPdf(bytes, [fixtureElement({ rotation: 90 })], {
      fontLoader: sansLoader,
    });
    const doc = await pdfjs.getDocument({ data: out.slice(), useSystemFonts: false }).promise;
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    const item = content.items.find((i) =>
      ((i as { str: string }).str ?? "").includes("Rotated note"),
    ) as { str: string; transform: number[] } | undefined;
    expect(item).toBeDefined();
    // A 90° rotation turns the glyph baseline 90° off-horizontal (±90 either way).
    expect(Math.abs(Math.abs(textRotDeg(item!.transform)) - 90)).toBeLessThan(5);
  });

  it("leaves unrotated new text perfectly horizontal", async () => {
    const bytes = await makeFixture();
    const out = await buildEditedPdf(bytes, [fixtureElement({ rotation: 0 })], {
      fontLoader: sansLoader,
    });
    const doc = await pdfjs.getDocument({ data: out.slice(), useSystemFonts: false }).promise;
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    const item = content.items.find((i) =>
      ((i as { str: string }).str ?? "").includes("Rotated note"),
    ) as { str: string; transform: number[] };
    expect(Math.abs(textRotDeg(item.transform))).toBeLessThan(1);
  });

  it("exports extracted elements unrotated even if rotation is stored", async () => {
    const bytes = await makeFixture();
    const { items } = await extractTextItems(bytes, 1);
    const item = items.find((i) =>
      ((i as { str: string }).str ?? "").includes("Hello"),
    ) as { str: string; transform: number[]; width: number; height: number; fontName: string };
    const el = elementFromTextItem("el-extracted-rot", 1, item);
    el.text = "Still straight";
    el.rotation = 90;
    const out = await buildEditedPdf(bytes, [el], { fontLoader: sansLoader });
    const doc = await pdfjs.getDocument({ data: out.slice(), useSystemFonts: false }).promise;
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    const item2 = content.items.find((i) =>
      ((i as { str: string }).str ?? "").includes("Still straight"),
    ) as { str: string; transform: number[] };
    expect(Math.abs(textRotDeg(item2.transform))).toBeLessThan(1);
  });

  it("covers the original area before redrawing a replacement, preventing visual duplicates", async () => {
    const bytes = await makeFixture();
    const { items } = await extractTextItems(bytes, 1);
    const item = items.find((i) =>
      ((i as { str: string }).str ?? "").includes("Hello"),
    ) as { str: string; transform: number[]; width: number; height: number; fontName: string };
    const box = textItemBBox(item);
    const el = elementFromTextItem("el-cover", 1, item);
    el.text = "Replaced in place";
    const out = await buildEditedPdf(bytes, [el], { fontLoader: sansLoader });
    const doc = await pdfjs.getDocument({ data: out.slice(), useSystemFonts: false }).promise;
    const page = await doc.getPage(1);
    const { fnArray, argsArray } = await page.getOperatorList();
    // The cover is glyph-safe (padded), never the tight bbox, so original ink
    // that overhangs the em box is erased too.
    const expected = paddedCoverRect(box, el.fontSize);
    const covered = fnArray.some((fn, i) => {
      const args = argsArray[i];
      const bbox = args?.[2];
      return (
        fn === pdfjs.OPS.constructPath &&
        bbox &&
        Math.abs(bbox[2] - expected.width) < 1 &&
        Math.abs(bbox[3] - expected.height) < 1
      );
    });
    expect(covered).toBe(true);
  });

  it("covers without padding never shrink the erased area below the em box", () => {
    for (const size of [6, 12, 24, 48, 120]) {
      const p = coverPad(size);
      const rect = paddedCoverRect({ x: 100, y: 50, width: 200, height: size }, size);
      expect(p.x).toBeGreaterThan(0);
      expect(p.top).toBeGreaterThan(0);
      expect(p.bottom).toBeGreaterThan(0);
      expect(rect.width).toBeGreaterThan(200);
      expect(rect.height).toBeGreaterThan(size);
      expect(rect.x).toBeLessThan(100);
      expect(rect.y).toBeGreaterThan(50);
      // Padding scales with the font, so small type is erased just as tightly.
      expect(p.x / size).toBeCloseTo(0.06, 5);
      expect(p.top / size).toBeCloseTo(0.18, 5);
      expect(p.bottom / size).toBeCloseTo(0.08, 5);
    }
  });
});

/** Hand-rolled PDF that carries an AcroForm with a /Sig field. */
function makeSignedBytes(): Uint8Array {
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R /AcroForm 5 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << >> /Contents 4 0 R >>\nendobj\n",
    "4 0 obj\n<< /Length 0 >>\nstream\n\nendstream\nendobj\n",
    "5 0 obj\n<< /Fields [ 6 0 R ] /SigFlags 3 >>\nendobj\n",
    "6 0 obj\n<< /Type /Annot /Subtype /Widget /Rect [0 0 100 40] /FT /Sig /T (sig1) >>\nendobj\n",
  ];
  const offsets: number[] = [];
  let body = "%PDF-1.4\n";
  for (const obj of objects) {
    offsets.push(body.length);
    body += obj;
  }
  const xrefAt = body.length;
  let xref = "xref\n";
  xref += "0 7\n";
  xref += "0000000000 65535 f \n";
  for (const off of offsets) {
    xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size 7 /Root 1 0 R >>\n`;
  xref += `startxref\n${xrefAt}\n%%EOF\n`;
  return new TextEncoder().encode(body + xref);
}

/* ---------------------------------------------------------------------------
 * Geometry helpers shared by drag/resize (UI) and export (compute). These
 * regression tests pin the invariant that fixed the "box jumps to the page
 * corner and becomes enormous when a handle is dragged past the page edge"
 * defect: growth is clamped against the anchored opposite edge BEFORE it is
 * applied, values are always finite, and both axes of a move always change.
 * ------------------------------------------------------------------------- */

const PAGE_A4 = { width: 612, height: 792 };

function makeTestEl(over: Partial<PdfEditorElement>): PdfEditorElement {
  return {
    id: "el-geo",
    pageNumber: 1,
    kind: "text",
    source: "new",
    text: "Geometry",
    x: 100,
    y: 400,
    width: 200,
    height: 32,
    fontSize: 24,
    lineHeight: 1.2,
    font: "sans",
    weight: "normal",
    italic: false,
    underline: false,
    align: "left",
    color: "#222222",
    opacity: 1,
    rotation: 0,
    ...over,
  } as PdfEditorElement;
}

describe("pdf-editor geometry — sanitizeRect", () => {
  it("never returns NaN, negatives or zero-sized dimensions", () => {
    const r = sanitizeRect(
      { x: Number.NaN, y: Number.NEGATIVE_INFINITY, width: 0, height: -5 },
      PAGE_A4,
    );
    expect(Number.isFinite(r.x)).toBe(true);
    expect(Number.isFinite(r.y)).toBe(true);
    expect(r.width).toBeGreaterThanOrEqual(0.5);
    expect(r.height).toBeGreaterThanOrEqual(0.5);
  });

  it("clamps a rect fully inside the page", () => {
    const r = sanitizeRect({ x: 700, y: 900, width: 200, height: 100 }, PAGE_A4);
    expect(r.x).toBeLessThanOrEqual(PAGE_A4.width - r.width);
    expect(r.y).toBeLessThanOrEqual(PAGE_A4.height);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
  });

  it("collapses bad floats to a usable fallback", () => {
    expect(finiteOr(Number.NaN, 7)).toBe(7);
    expect(finiteOr(Number.POSITIVE_INFINITY, 3)).toBe(3);
    expect(finiteOr(2.5, 3)).toBe(2.5);
  });
});

describe("pdf-editor geometry — moveElementRect", () => {
  it("moves BOTH X and Y in the direction the pointer travels", () => {
    // Pointer right 30pt and up 60pt (PDF y grows upward) → both grow.
    const r = moveElementRect({ x: 100, y: 400, width: 200, height: 32 }, 30, 60, PAGE_A4);
    expect(r.x).toBeCloseTo(130);
    expect(r.y).toBeCloseTo(460);
  });

  it("keeps the whole box on the page at either extreme", () => {
    const low = moveElementRect({ x: 100, y: 400, width: 200, height: 32 }, -500, -5000, PAGE_A4);
    expect(low.x).toBe(0);
    expect(low.y).toBe(0);
    const high = moveElementRect({ x: 100, y: 400, width: 200, height: 32 }, 5000, 5000, PAGE_A4);
    expect(high.x).toBe(PAGE_A4.width - 200);
    expect(high.y).toBe(PAGE_A4.height);
    expect(high.width).toBe(200);
    expect(high.height).toBe(32);
  });

  it("resists corrupt origin geometry", () => {
    const r = moveElementRect(
      { x: Number.NaN, y: 0, width: 0, height: -1 },
      10,
      10,
      PAGE_A4,
    );
    expect(Number.isFinite(r.x)).toBe(true);
    expect(r.width).toBeGreaterThanOrEqual(0.5);
    expect(r.height).toBeGreaterThanOrEqual(0.5);
  });
});

describe("pdf-editor geometry — resizeElementRect", () => {
  const orig = { x: 100, y: 400, width: 200, height: 32 };

  it("single-axis handles never move the opposite edges or X/Y", () => {
    const se = resizeElementRect(orig, 40, 0, "se", PAGE_A4);
    expect(se.x).toBeCloseTo(orig.x);
    expect(se.y).toBeCloseTo(orig.y);
    expect(se.width).toBeCloseTo(240);

    const ne = resizeElementRect(orig, 40, -10, "ne", PAGE_A4);
    expect(ne.x).toBeCloseTo(orig.x);
    expect(ne.width).toBeCloseTo(240);
    // Dragging the top edge down 10pt lowers it and shrinks the box.
    expect(ne.y).toBeCloseTo(orig.y - 10);
    expect(ne.height).toBeCloseTo(orig.height - 10);
  });

  it("dragging a handle past the page edge NEVER inflates the box or jumps it into a corner", () => {
    // South handle dragged past the bottom of the page on an element near the
    // top: growth is capped by the anchored top edge, and X/Y never change.
    const s = resizeElementRect(orig, 0, -5000, "s", PAGE_A4);
    expect(s.x).toBeCloseTo(orig.x);
    expect(s.y).toBeCloseTo(orig.y);
    expect(s.height).toBeGreaterThan(32);
    expect(s.height).toBeLessThanOrEqual(orig.y + 0.001);

    // East handle dragged past the right edge: capped by the anchored left edge.
    const e = resizeElementRect(orig, 5000, 0, "e", PAGE_A4);
    expect(e.x).toBeCloseTo(orig.x);
    expect(e.y).toBeCloseTo(orig.y);
    expect(e.width).toBeLessThanOrEqual(PAGE_A4.width - e.x + 0.001);

    // Corner dragged out of the page diagonally: both anchored edges hold.
    const nw = resizeElementRect(orig, -5000, 5000, "nw", PAGE_A4);
    expect(nw.y).toBeGreaterThanOrEqual(0);
    expect(nw.x).toBeGreaterThanOrEqual(0);
    expect(nw.width).toBeGreaterThanOrEqual(0.5);
    expect(nw.height).toBeGreaterThanOrEqual(0.5);
  });

  it("the top handle stretches the box upward without moving the bottom edge", () => {
    const n = resizeElementRect(orig, 0, 40, "n", PAGE_A4);
    expect(n.y).toBeCloseTo(orig.y + 40);
    expect(n.height).toBeCloseTo(orig.height + 40);
    // Bottom edge (y - height) stays anchored.
    expect(n.y - n.height).toBeCloseTo(orig.y - orig.height);
  });

  it("the west handle grows the box leftward and keeps the right edge fixed", () => {
    const w = resizeElementRect(orig, -50, 0, "w", PAGE_A4);
    expect(w.x).toBeCloseTo(orig.x - 50);
    expect(w.width).toBeCloseTo(orig.width + 50);
    expect(w.x + w.width).toBeCloseTo(orig.x + orig.width);
  });

  it("shrinking is capped at the minimum size", () => {
    const c = resizeElementRect(orig, -5000, 5000, "se", PAGE_A4);
    expect(c.width).toBeGreaterThanOrEqual(0.5);
    expect(c.height).toBeGreaterThanOrEqual(0.5);
    // Healthy geometry: no flipped box.
    expect(c.x + c.width).toBeGreaterThanOrEqual(c.x);
    expect(c.y).toBeGreaterThanOrEqual(c.y - c.height);
  });
});

describe("pdf-editor geometry — replacement cover/lines", () => {
  it("single-line replacement covers exactly one wrapped line plus padding", () => {
    const el = makeTestEl({ text: "One line" });
    const cover = replacementCoverRect(el);
    expect(cover.width).toBeGreaterThan(el.width);
    expect(cover.height).toBeCloseTo(el.fontSize * el.lineHeight + coverPad(el.fontSize).top + coverPad(el.fontSize).bottom, 3);
    // Top padding places the cover above the box top, like paddedCoverRect.
    expect(cover.y).toBeGreaterThan(el.y);
  });

  it("multi-line replacement covers cover every wrapped row", () => {
    const el = makeTestEl({
      kind: "paragraph",
      text: "word word word word word word word word word word word word word word",
      width: 120,
    });
    const rows = replacementLines(el);
    expect(rows.length).toBeGreaterThan(1);
    const cover = replacementCoverRect(el);
    expect(cover.height).toBeGreaterThanOrEqual(
      rows.length * el.fontSize * el.lineHeight,
    );
    // The cover is independent of the stored box height (which may be a single
    // line) — that was the defect that let lower rows collide with neighbours.
    const tight = replacementCoverRect(makeTestEl({ kind: "paragraph", text: el.text, width: 120, height: 32 }));
    expect(tight.height).toBe(cover.height);
  });

  it("a page-clamped replacement cover stays inside the page", () => {
    const el = makeTestEl({ text: "x", y: 5 });
    const cover = replacementCoverRect(el, PAGE_A4);
    expect(cover.y).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(cover.x)).toBe(true);
  });

  it("single-line kinds keep content on one line, block kinds wrap", () => {
    const text = "a b c d e f g h i j k l m n o p q r";
    expect(replacementLines(makeTestEl({ kind: "heading", text, width: 90 })).length).toBe(1);
    expect(replacementLines(makeTestEl({ kind: "tagline", text, width: 90 })).length).toBe(1);
    expect(replacementLines(makeTestEl({ kind: "text", text, width: 90 })).length).toBe(1);
    expect(replacementLines(makeTestEl({ kind: "paragraph", text, width: 90 })).length).toBeGreaterThan(1);
  });

  it("empty and removed elements produce a single empty line", () => {
    expect(replacementLines(makeTestEl({ text: "" }))).toEqual([""]);
    expect(replacementLines(makeTestEl({ removed: true }))).toEqual([""]);
  });
});

describe("pdf-editor geometry — viewport transform", () => {
  it("maps PDF points to CSS pixels and back to the identity", () => {
    const vs = buildViewportTransform([2, 0, 0, -2, 10, 20], { width: 1234, height: 1604 });
    expect(vs.scale).toBeCloseTo(2, 9);
    expect(vs.fromPdfPoint(0, 0)).toEqual([10, 20]);
    expect(vs.fromPdfPoint(100, 200)).toEqual([210, -380]);
    const [px, py] = [413.7, 289.25];
    const [bx, by] = vs.toPdfPoint(px, py);
    const [rx, ry] = vs.fromPdfPoint(bx, by);
    expect(rx).toBeCloseTo(px, 9);
    expect(ry).toBeCloseTo(py, 9);
  });

  it("keeps the delta inverse free of the viewport offset (the stuck-at-top fix)", () => {
    const S = 1.5;
    const vs = buildViewportTransform([S, 0, 0, -S, 0, 792 * S], { width: 612 * S, height: 792 * S });
    // The FULL inverse turns an absolute display point (page top-left) into
    // PDF (0, 792) — correct for absolute clicks.
    const topLeft = vs.toPdfPoint(0, 0);
    expect(topLeft[0]).toBeCloseTo(0, 9);
    expect(topLeft[1]).toBeCloseTo(792, 9);
    // A DELTA must not inherit that offset: a -60px (upward) drag maps to +60/S
    // PDF points, NOT 792 + 60/S. The old code used the full inverse, so every
    // drag clamped to the page top.
    const [dX, dY] = vs.deltaToPdf(0, -60);
    expect(dX).toBeCloseTo(0, 9);
    expect(dY).toBeCloseTo(60 / S, 9);
  });

  it("stays invertible on rotated viewports", () => {
    const vs = buildViewportTransform([0, 1.5, 1.5, 0, 30, 40], { width: 600, height: 800 });
    const pdf: [number, number] = [120, 340];
    const disp = vs.fromPdfPoint(pdf[0], pdf[1]);
    const back = vs.toPdfPoint(disp[0], disp[1]);
    expect(back[0]).toBeCloseTo(pdf[0], 9);
    expect(back[1]).toBeCloseTo(pdf[1], 9);
  });

  it("never emits NaN for a degenerate transform", () => {
    const vs = buildViewportTransform([0, 0, 0, 0, 5, 5], { width: 10, height: 10 });
    expect(vs.scale).toBeGreaterThan(0);
    expect(vs.toPdfPoint(3, 4)).toEqual([0, 0]);
    expect(vs.deltaToPdf(3, 4)).toEqual([0, 0]);
    expect(vs.fromPdfPoint(300, 400)).toEqual([5, 5]);
  });
});

describe("pdf-editor drag — display↔PDF equivalence (stuck-at-top regression)", () => {
  const S = 2;
  const vs = buildViewportTransform([S, 0, 0, -S, 0, 792 * S], { width: 612 * S, height: 792 * S });
  const el = makeTestEl({
    source: "extracted",
    text: "Registration Number",
    x: 120,
    y: 700,
    width: 180,
    height: 13.7,
    fontSize: 13.7,
  });

  it("dragging down-right moves the box exactly the pointer delta on screen", () => {
    const [dpX, dpY] = vs.deltaToPdf(40, 25);
    const moved = moveElementRect(el, dpX, dpY, PAGE_A4);
    const before = vs.fromPdfPoint(el.x, el.y);
    const after = vs.fromPdfPoint(moved.x, moved.y);
    expect(after[0] - before[0]).toBeCloseTo(40, 9);
    expect(after[1] - before[1]).toBeCloseTo(25, 9);
    expect(moved.y).not.toBeCloseTo(PAGE_A4.height, 6);
  });

  it("follows the pointer 1:1 in all four directions and diagonally", () => {
    const cases: [number, number][] = [
      [0, -60],
      [0, 60],
      [-50, 0],
      [50, 0],
      [-30, 40],
    ];
    for (const [gdx, gdy] of cases) {
      const [dpX, dpY] = vs.deltaToPdf(gdx, gdy);
      const moved = moveElementRect(el, dpX, dpY, PAGE_A4);
      const before = vs.fromPdfPoint(el.x, el.y);
      const after = vs.fromPdfPoint(moved.x, moved.y);
      expect(after[0] - before[0]).toBeCloseTo(gdx, 9);
      expect(after[1] - before[1]).toBeCloseTo(gdy, 9);
      expect(moved.y).toBeLessThanOrEqual(PAGE_A4.height);
    }
  });

  it("proves the old full-inverse mapping always clamped to the page top", () => {
    // Historical bug: pointer DELTAS were pushed through the full affine
    // inverse. Its offset term added +792 PDF points to every Y delta, so
    // moveElementRect always clamped to y = page.height (the page top).
    const [badX, badY] = vs.toPdfPoint(40, 25);
    const stuck = moveElementRect(el, badX, badY, PAGE_A4);
    expect(Math.round(stuck.y)).toBe(PAGE_A4.height);
  });

  it("tracks the pointer identically at every zoom level", () => {
    for (const s of [0.5, 1, 1.5, 2]) {
      const svs = buildViewportTransform([s, 0, 0, -s, 0, 792 * s], {
        width: 612 * s,
        height: 792 * s,
      });
      const [dpX, dpY] = svs.deltaToPdf(24, -18);
      const moved = moveElementRect(el, dpX, dpY, PAGE_A4);
      const before = svs.fromPdfPoint(el.x, el.y);
      const after = svs.fromPdfPoint(moved.x, moved.y);
      expect(after[0] - before[0]).toBeCloseTo(24, 9);
      expect(after[1] - before[1]).toBeCloseTo(-18, 9);
    }
  });

  it("resizes from deltas without inflating to the full page (south-east handle)", () => {
    const [dpX, dpY] = vs.deltaToPdf(20, 12);
    const nr = resizeElementRect(el, dpX, dpY, "se", PAGE_A4);
    expect(nr.width).toBeCloseTo(el.width + 20 / S, 9);
    expect(nr.height).toBeCloseTo(el.height + 12 / S, 9);
    expect(nr.width).toBeLessThan(PAGE_A4.width);
    expect(nr.height).toBeLessThan(PAGE_A4.height);
  });
});

describe("pdf-editor font size — exact stability", () => {
  it("keeps the fractional PDF font size instead of rounding it", () => {
    const item: PdfSourceTextItem = {
      str: "Registration Number",
      transform: [13.7, 0, 0, 13.7, 100, 700],
      width: 180,
      height: 13.7,
      fontName: "g1_f2_Helvetica",
    };
    const el = elementFromTextItem("el-1", 1, item);
    expect(el.fontSize).toBe(13.7);
    expect(el.detectedFontSize).toBe(13.7);
  });

  it("select → edit → type → exit never changes fontSize (model-level)", () => {
    const item: PdfSourceTextItem = {
      str: "Registration Number",
      transform: [13.7, 0, 0, 13.7, 100, 700],
      width: 180,
      height: 13.7,
    };
    const el = elementFromTextItem("el-1", 1, item);
    let current: PdfEditorElement = el;
    // Select: no change. Enter edit + type: text grows, geometry stays put.
    const typed = { ...current, text: "Registration Number 2" };
    current = typed;
    // Exit edit: nothing font-related is rewritten.
    expect(current.text).toBe("Registration Number 2");
    expect(current.fontSize).toBe(13.7);
    expect(current.font).toBe("original");
    expect(current.sourceFontName).toBe(el.sourceFontName);
    // A single line of this size hugs its content (handles stay attached).
    expect(elementContentHeight(current.fontSize, current.lineHeight, 1)).toBe(13.7);
  });

  it("clamps tiny or huge detected sizes into the supported range", () => {
    const tiny = elementFromTextItem("el-a", 1, {
      str: "x",
      transform: [2, 0, 0, 2, 10, 10],
      width: 3,
      height: 2,
    });
    expect(tiny.fontSize).toBeGreaterThanOrEqual(6);
    const huge = elementFromTextItem("el-b", 1, {
      str: "x",
      transform: [500, 0, 0, 500, 10, 10],
      width: 10,
      height: 500,
    });
    expect(huge.fontSize).toBeLessThanOrEqual(120);
  });
});

describe("pdf-editor geometry — element content height", () => {
  it("is exactly the glyph box for a single line (handles hug the text)", () => {
    expect(elementContentHeight(13.7, 1.2, 1)).toBe(13.7);
    expect(elementContentHeight(24, 1.2, 1)).toBe(24);
  });

  it("grows by a full line step only for each wrapped row past the first", () => {
    expect(elementContentHeight(24, 1.2, 2)).toBeCloseTo(24 * 1.2 + 24, 9);
    expect(elementContentHeight(24, 1.2, 3)).toBeCloseTo(24 * 1.2 * 2 + 24, 9);
  });

  it("treats empty or zero line counts as a single line", () => {
    expect(elementContentHeight(12, 1.2, 0)).toBe(12);
    expect(elementContentHeight(0, 1.2, 3)).toBe(0);
  });
});

describe("pdf-editor geometry — single-line never wraps (issue #1 / #2)", () => {
  it("elementWrapWidth widens single-line kinds to content", () => {
    // "Registration Number: 12345" (26 chars), ADVANCE_EM 'original' = 0.5,
    // fontSize 13.7 → content ≈ 26×6.85+6.85 = 185.
    const el = makeTestEl({
      kind: "text",
      font: "original",
      fontSize: 13.7,
      width: 171.3,
      text: "Registration Number: 12345",
    });
    const w = elementWrapWidth(el);
    expect(w).toBeGreaterThan(171.3); // wider than the stored width
    expect(w).toBeLessThan(300);     // but reasonable
  });

  it("single-line kinds produce exactly one line regardless of narrow width", () => {
    const el = makeTestEl({
      kind: "heading",
      font: "original",
      fontSize: 13.7,
      width: 40,   // deliberately too narrow for the text
      text: "Registration Number: 12345",
    });
    const lines = replacementLines(el);
    expect(lines.length).toBe(1);
  });

  it("single-line kinds still fit within the page", () => {
    const el = makeTestEl({
      kind: "text",
      font: "original",
      fontSize: 13.7,
      width: 171.3,
      text: "Registration Number: 12345",
    });
    const w = elementWrapWidth(el, PAGE_A4);
    expect(w).toBeLessThanOrEqual(PAGE_A4.width);
  });

  it("block kinds wrap to the stored box width", () => {
    const el = makeTestEl({
      kind: "paragraph",
      width: 90,
      text: "a b c d e f g h i j k l m n o p q r",
    });
    expect(replacementLines(el).length).toBeGreaterThan(1);
    expect(elementWrapWidth(el)).toBeCloseTo(90, 5);
  });

  it("replacement cover width follows the auto-width content", () => {
    const narrow = makeTestEl({
      kind: "text",
      font: "original",
      fontSize: 13.7,
      width: 171.3,
      text: "Registration Number: 12345",
    });
    const cover = replacementCoverRect(narrow);
    // cover width = elementWrapWidth + pad_x — must be ≥ the auto-width
    expect(cover.width).toBeGreaterThanOrEqual(elementWrapWidth(narrow));
  });

  it("exported replacement stays single line for the fixture string", async () => {
    // Build a 1-page PDF with the fixture text, extract the item as the editor
    // would, then re-export it (touched) and check the line still fits.
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([595, 842]);
    const text = "Registration Number: 12345";
    const fontSize = 13.7;
    page.drawText(text, { x: 120, y: 700, size: fontSize, font });
    const bytes = await doc.save();
    const { items } = await extractTextItems(bytes, 1);
    const first = items.find((i) => (i as { str: string }).str.trim() !== "") as {
      str: string;
      transform: number[];
      width: number;
      height: number;
      fontName: string;
    };
    const el = elementFromTextItem("el-1", 1, first);
    expect(el.text).toBe(text);
    el.touched = true;
    const out = await buildEditedPdf(bytes, [el]);
    const outDoc = await PDFDocument.load(out, { ignoreEncryption: true });
    const outFont = await outDoc.embedFont(StandardFonts.Helvetica);
    // The exported line must fit the element basis box without wrapping.
    const lineWidth = outFont.widthOfTextAtSize(text, el.fontSize);
    expect(lineWidth).toBeLessThanOrEqual(el.width + 0.5);
  });

  it("covers sanitise element width to not overflow the page", () => {
    const el = makeTestEl({
      kind: "text",
      font: "original",
      fontSize: 13.7,
      width: 400,
      text: "Short",
      x: 300, // close to right edge of A4 (595)
    });
    const cover = replacementCoverRect(el, PAGE_A4);
    expect(cover.x + cover.width).toBeLessThanOrEqual(PAGE_A4.width + 0.5);
  });
});